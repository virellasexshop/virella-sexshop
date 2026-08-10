import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getProductById } from "@/modules/products/product.service";
import { getMercadoLivreCategoryAttributes, mercadoLivreFetch } from "./client";

function money(value) {
  const n = Number(value || 0);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
}

function positiveInt(value, fallback = 1) {
  const n = Math.floor(Number(value));
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function cleanText(value, maxLength) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return maxLength ? text.slice(0, maxLength) : text;
}

function collectPictures(product) {
  const urls = [
    product.imagem_principal,
    ...(product.produto_imagens || []).map((image) => image.url),
  ]
    .map((url) => String(url || "").trim())
    .filter(Boolean);
  return [...new Set(urls)].slice(0, 10).map((source) => ({ source }));
}

function parseExtraAttributes(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "object") {
    return Object.entries(raw)
      .filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== "")
      .map(([id, value]) => ({ id, value_name: String(value).trim() }));
  }
  return [];
}

function findCategoryAttribute(categoryAttributes, id) {
  return (categoryAttributes || []).find((attribute) => attribute?.id === id) || null;
}

function resolveAttributeValue(meta, rawValue) {
  const value = cleanText(rawValue, 255);
  if (!value) return null;
  const options = Array.isArray(meta?.values) ? meta.values : [];
  const match = options.find((option) =>
    String(option?.id || "").trim() === value ||
    String(option?.name || "").trim().toLowerCase() === value.toLowerCase()
  );
  if (match?.id) return { value_id: String(match.id) };
  return { value_name: value };
}

function mapCommonAttributes(product, input, categoryAttributes = []) {
  const attrs = [];
  const brand = cleanText(input.brand, 255);
  const model = cleanText(input.model, 255);
  const gtin = cleanText(input.gtin || product.codigo_barras, 40);
  const emptyGtinReason = cleanText(input.empty_gtin_reason, 255);
  const emptyGtinReasonMeta = findCategoryAttribute(categoryAttributes, "EMPTY_GTIN_REASON");
  if (brand) attrs.push({ id: "BRAND", value_name: brand });
  if (model) attrs.push({ id: "MODEL", value_name: model });
  if (gtin) {
    attrs.push({ id: "GTIN", value_name: gtin });
  } else if (emptyGtinReason) {
    const resolved = resolveAttributeValue(emptyGtinReasonMeta, emptyGtinReason);
    attrs.push({ id: "EMPTY_GTIN_REASON", ...(resolved || { value_name: emptyGtinReason }) });
  }

  const extras = parseExtraAttributes(input.attributes).filter(
    (attr) => !["BRAND", "MODEL", "GTIN", "EMPTY_GTIN_REASON"].includes(attr.id)
  );
  return [...attrs, ...extras];
}

function buildVariations(product, input, variationAttributeId, variationAttributes = []) {
  if (!variationAttributeId) return null;

  const active = (product.produto_variacoes || []).filter((variation) => variation.ativo !== false);
  const rows = [];

  if (product.opcao_principal_nome) {
    rows.push({
      name: product.opcao_principal_nome,
      price: money(input.price || product.preco_promocional || product.preco),
      quantity: positiveInt(input.available_quantity, 10),
      sku: product.sku || null,
    });
  }

  for (const variation of active) {
    rows.push({
      name: variation.nome,
      price: money(variation.preco || input.price || product.preco_promocional || product.preco),
      quantity: positiveInt(input.available_quantity_per_variation, positiveInt(input.available_quantity, 10)),
      sku: variation.sku || null,
    });
  }

  if (rows.length < 2) return null;

  return rows.map((row) => ({
    attribute_combinations: [{ id: variationAttributeId, value_name: cleanText(row.name, 60) }],
    price: row.price,
    available_quantity: row.quantity,
    ...(variationAttributes.length ? { attributes: variationAttributes.map((attribute) => ({ ...attribute })) } : {}),
    ...(row.sku ? { seller_custom_field: cleanText(row.sku, 64) } : {}),
  }));
}

export async function getMercadoLivreMappings(productIds = []) {
  const supabase = createSupabaseAdminClient();
  let query = supabase.from("mercado_livre_produtos").select("*");
  if (productIds.length) query = query.in("produto_id", productIds);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

async function saveMapping(productId, values) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("mercado_livre_produtos")
    .upsert(
      {
        produto_id: productId,
        ...values,
        atualizado_em: new Date().toISOString(),
      },
      { onConflict: "produto_id" }
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function publishProductToMercadoLivre(productId, input = {}) {
  const product = await getProductById(productId);
  if (!product) throw new Error("Produto não encontrado.");

  const categoryId = cleanText(input.category_id, 50);
  if (!categoryId) throw new Error("Escolha uma categoria do Mercado Livre.");

  const categoryAttributes = await getMercadoLivreCategoryAttributes(categoryId);

  const gtinMeta = categoryAttributes.find((attribute) => attribute?.id === "GTIN");
  const emptyGtinReasonMeta = categoryAttributes.find((attribute) => attribute?.id === "EMPTY_GTIN_REASON");
  const gtin = cleanText(input.gtin || product.codigo_barras, 40);
  const emptyGtinReason = cleanText(input.empty_gtin_reason, 255);
  const emptyGtinReasonMeta = findCategoryAttribute(categoryAttributes, "EMPTY_GTIN_REASON");

  if ((gtinMeta?.tags?.required || gtinMeta?.tags?.conditional_required) && !gtin && !emptyGtinReason) {
    if (emptyGtinReasonMeta) {
      throw new Error("Esta categoria exige GTIN/EAN. Informe o código de barras ou selecione o motivo pelo qual o produto não possui GTIN.");
    }
    throw new Error("Esta categoria exige GTIN/EAN. Informe um código de barras válido para publicar.");
  }

  if (!gtin && emptyGtinReason && !emptyGtinReasonMeta) {
    throw new Error("A categoria selecionada não aceita motivo de ausência de GTIN. Informe um GTIN/EAN ou escolha outra categoria correta.");
  }

  if (!gtin && emptyGtinReason && Array.isArray(emptyGtinReasonMeta?.values) && emptyGtinReasonMeta.values.length) {
    const allowedReason = emptyGtinReasonMeta.values.some((value) =>
      String(value?.name || "").trim().toLowerCase() === emptyGtinReason.toLowerCase()
    );
    if (!allowedReason) {
      throw new Error("Selecione um motivo de ausência de GTIN aceito pelo Mercado Livre para esta categoria.");
    }
  }

  const allowedVariationIds = new Set(
    categoryAttributes
      .filter((attribute) => attribute?.tags?.allow_variations)
      .map((attribute) => attribute.id)
  );

  const requestedVariationAttribute = cleanText(input.variation_attribute_id, 80);
  const variationAttributeId = allowedVariationIds.has(requestedVariationAttribute)
    ? requestedVariationAttribute
    : null;
  // O Mercado Livre pode exigir GTIN/EMPTY_GTIN_REASON em cada variação,
  // mesmo quando o atributo também está no nível principal do anúncio.
  const commonAttributes = mapCommonAttributes(product, input, categoryAttributes);
  const variationRequiredAttributes = commonAttributes.filter((attribute) =>
    ["GTIN", "EMPTY_GTIN_REASON"].includes(attribute.id)
  );
  const variations = buildVariations(product, input, variationAttributeId, variationRequiredAttributes);

  const price = money(input.price || product.preco_promocional || product.preco);
  if (!(price > 0)) throw new Error("Informe um preço válido para o Mercado Livre.");

  const pictures = collectPictures(product);
  if (!pictures.length) throw new Error("O produto precisa ter pelo menos uma foto antes de publicar.");

  const title = cleanText(input.title || product.nome, 60);
  const body = {
    title,
    category_id: categoryId,
    price,
    currency_id: "BRL",
    available_quantity: variations ? undefined : positiveInt(input.available_quantity, 10),
    buying_mode: "buy_it_now",
    condition: input.condition === "used" ? "used" : "new",
    listing_type_id: cleanText(input.listing_type_id || "gold_special", 40),
    pictures,
    attributes: commonAttributes,
    ...(product.sku && !variations ? { seller_custom_field: cleanText(product.sku, 64) } : {}),
    ...(variations ? { variations } : {}),
  };

  Object.keys(body).forEach((key) => body[key] === undefined && delete body[key]);

  try {
    const created = await mercadoLivreFetch("/items", {
      method: "POST",
      body: JSON.stringify(body),
    });

    const description = String(input.description || product.descricao || product.descricao_curta || "").trim();
    if (description && created?.id) {
      try {
        await mercadoLivreFetch(`/items/${encodeURIComponent(created.id)}/description`, {
          method: "POST",
          body: JSON.stringify({ plain_text: description.slice(0, 50000) }),
        });
      } catch (descriptionError) {
        console.error("Anúncio criado, mas a descrição não pôde ser enviada:", descriptionError);
      }
    }

    await saveMapping(product.id, {
      ml_item_id: created.id,
      ml_permalink: created.permalink || null,
      category_id: categoryId,
      listing_type_id: body.listing_type_id,
      condition: body.condition,
      ml_title: title,
      ml_price: price,
      available_quantity: variations ? null : body.available_quantity,
      variation_attribute_id: variationAttributeId,
      attributes: input.attributes || {},
      status: created.status || "active",
      last_error: null,
      sincronizado_em: new Date().toISOString(),
    });

    return created;
  } catch (error) {
    await saveMapping(product.id, {
      category_id: categoryId,
      listing_type_id: body.listing_type_id,
      condition: body.condition,
      ml_title: title,
      ml_price: price,
      variation_attribute_id: variationAttributeId,
      attributes: input.attributes || {},
      last_error: JSON.stringify(error.details || { message: error.message }).slice(0, 10000),
    });
    throw error;
  }
}

export async function syncProductToMercadoLivre(productId, input = {}) {
  const product = await getProductById(productId);
  if (!product) throw new Error("Produto não encontrado.");

  const [mapping] = await getMercadoLivreMappings([productId]);
  if (!mapping?.ml_item_id) throw new Error("Este produto ainda não foi publicado no Mercado Livre.");

  const price = money(input.price || product.preco_promocional || product.preco);
  const title = cleanText(input.title || mapping.ml_title || product.nome, 60);
  const payload = { title, price };

  if (!mapping.variation_attribute_id) {
    payload.available_quantity = positiveInt(input.available_quantity, mapping.available_quantity || 10);
  }

  const updated = await mercadoLivreFetch(`/items/${encodeURIComponent(mapping.ml_item_id)}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

  await saveMapping(productId, {
    ml_permalink: updated.permalink || mapping.ml_permalink,
    ml_title: title,
    ml_price: price,
    available_quantity: payload.available_quantity ?? mapping.available_quantity,
    status: updated.status || mapping.status,
    last_error: null,
    sincronizado_em: new Date().toISOString(),
  });

  return updated;
}

export async function setMercadoLivreItemStatus(productId, status) {
  const [mapping] = await getMercadoLivreMappings([productId]);
  if (!mapping?.ml_item_id) throw new Error("Produto não publicado no Mercado Livre.");
  const allowed = status === "paused" ? "paused" : "active";
  const updated = await mercadoLivreFetch(`/items/${encodeURIComponent(mapping.ml_item_id)}`, {
    method: "PUT",
    body: JSON.stringify({ status: allowed }),
  });
  await saveMapping(productId, {
    status: updated.status || allowed,
    last_error: null,
    sincronizado_em: new Date().toISOString(),
  });
  return updated;
}
