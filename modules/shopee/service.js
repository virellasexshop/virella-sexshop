import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { shopeeRequest, shopeeTokenRequest } from "@/lib/shopee/client";
import { getProductById } from "@/modules/products/product.service";

function nowIso() { return new Date().toISOString(); }

export async function getConnection() {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("shopee_conexao").select("*").limit(1).maybeSingle();
  if (error) throw error;
  return data;
}

export async function saveAuthorization({ code, shopId }) {
  const token = await shopeeTokenRequest("/api/v2/auth/token/get", { code, shop_id: Number(shopId) });
  const supabase = createSupabaseAdminClient();
  const expiresAt = new Date(Date.now() + Number(token.expire_in || 0) * 1000).toISOString();
  const values = {
    id: 1,
    shop_id: Number(shopId),
    access_token: token.access_token,
    refresh_token: token.refresh_token,
    expira_em: expiresAt,
    atualizado_em: nowIso(),
  };
  const { error } = await supabase.from("shopee_conexao").upsert(values, { onConflict: "id" });
  if (error) throw error;
  return values;
}

async function validConnection() {
  let connection = await getConnection();
  if (!connection) throw new Error("Conecte sua loja Shopee primeiro.");
  const expires = new Date(connection.expira_em || 0).getTime();
  if (expires - Date.now() > 10 * 60 * 1000) return connection;

  const token = await shopeeTokenRequest("/api/v2/auth/access_token/get", {
    refresh_token: connection.refresh_token,
    shop_id: Number(connection.shop_id),
  });
  const supabase = createSupabaseAdminClient();
  const updates = {
    access_token: token.access_token,
    refresh_token: token.refresh_token || connection.refresh_token,
    expira_em: new Date(Date.now() + Number(token.expire_in || 0) * 1000).toISOString(),
    atualizado_em: nowIso(),
  };
  const { error } = await supabase.from("shopee_conexao").update(updates).eq("id", connection.id);
  if (error) throw error;
  return { ...connection, ...updates };
}

async function api(path, options = {}) {
  const connection = await validConnection();
  return shopeeRequest({
    path,
    accessToken: connection.access_token,
    shopId: connection.shop_id,
    ...options,
  });
}

export async function getShopeeCategories() {
  const result = await api("/api/v2/product/get_category", { query: { language: "pt-BR" } });
  return result?.response?.category_list || [];
}

export async function getShopeeLogistics() {
  const result = await api("/api/v2/logistics/get_channel_list");
  return result?.response?.logistics_channel_list || [];
}

export async function getCategoryMappings() {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("shopee_categoria_mapeamento").select("*");
  if (error) throw error;
  return data || [];
}

export async function saveCategoryMapping(localCategoryId, shopeeCategoryId, shopeeCategoryName) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("shopee_categoria_mapeamento").upsert({
    categoria_id: localCategoryId,
    shopee_category_id: Number(shopeeCategoryId),
    shopee_category_name: shopeeCategoryName,
    atualizado_em: nowIso(),
  }, { onConflict: "categoria_id" });
  if (error) throw error;
}

async function uploadImage(url) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`Não foi possível baixar a imagem: ${url}`);
  const blob = await response.blob();
  const form = new FormData();
  form.append("image", blob, "produto.jpg");
  const result = await api("/api/v2/media_space/upload_image", { method: "POST", body: form });
  const imageId = result?.response?.image_info?.image_id || result?.response?.image_id;
  if (!imageId) throw new Error("A Shopee não retornou o ID da imagem.");
  return imageId;
}

async function productMapping(product) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("shopee_categoria_mapeamento")
    .select("*")
    .eq("categoria_id", product.categoria_id)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error(`Mapeie a categoria de “${product.nome}” antes de publicar.`);
  return data;
}

function cleanDescription(product) {
  const text = String(product.descricao || "").replace(/\s+/g, " ").trim();
  return (text.length >= 10 ? text : `${product.nome}. Produto enviado em embalagem discreta.`).slice(0, 5000);
}

function stockValue(value) {
  const stock = Number(value || 0);
  return Number.isFinite(stock) && stock > 0 ? Math.floor(stock) : 100;
}

async function buildPayload(product) {
  const mapping = await productMapping(product);
  const imageUrls = [product.imagem_principal, ...(product.produto_imagens || []).map(i => i.url)]
    .filter(Boolean).filter((url, index, list) => list.indexOf(url) === index).slice(0, 9);
  if (!imageUrls.length) throw new Error("O produto precisa ter pelo menos uma imagem.");
  const imageIds = [];
  for (const url of imageUrls) imageIds.push(await uploadImage(url));

  const logistics = (await getShopeeLogistics()).filter(channel => channel.enabled !== false);
  if (!logistics.length) throw new Error("Nenhum canal logístico da Shopee está habilitado.");

  const variations = (product.produto_variacoes || []).filter(v => v.ativo !== false);
  const base = {
    original_price: Number(product.preco_final || product.preco || 0),
    seller_stock: [{ stock: stockValue(product.quantidade) }],
  };
  const payload = {
    item_name: String(product.nome).slice(0, 120),
    description: cleanDescription(product),
    category_id: Number(mapping.shopee_category_id),
    item_sku: String(product.id).slice(0, 100),
    condition: "NEW",
    image: { image_id_list: imageIds },
    weight: Math.max(0.01, Number(product.peso_kg || 0.3)),
    dimension: {
      package_length: Math.max(1, Math.round(Number(product.comprimento_cm || 18))),
      package_width: Math.max(1, Math.round(Number(product.largura_cm || 12))),
      package_height: Math.max(1, Math.round(Number(product.altura_cm || 8))),
    },
    logistic_info: logistics.map(channel => ({ logistic_id: Number(channel.logistics_channel_id), enabled: true })),
    pre_order: { is_pre_order: false },
    brand: { brand_id: 0, original_brand_name: "Sem marca" },
    ...base,
  };

  if (variations.length) {
    payload.tier_variation = [{ name: "Opção", option_list: variations.map(v => ({ option: String(v.nome).slice(0, 30) })) }];
    payload.model = variations.map((variation, index) => ({
      tier_index: [index],
      model_sku: String(variation.sku || `${product.id}-${index + 1}`).slice(0, 100),
      original_price: Number(variation.preco_final || variation.preco || product.preco_final || product.preco || 0),
      seller_stock: [{ stock: stockValue(variation.quantidade) }],
    }));
    delete payload.original_price;
    delete payload.seller_stock;
  }
  return payload;
}

async function saveLink(productId, values) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("shopee_produtos").upsert({
    produto_id: productId,
    ...values,
    atualizado_em: nowIso(),
  }, { onConflict: "produto_id" });
  if (error) throw error;
}

export async function publishProduct(productId) {
  const product = await getProductById(productId);
  if (!product) throw new Error("Produto não encontrado.");
  const payload = await buildPayload(product);
  try {
    const result = await api("/api/v2/product/add_item", { method: "POST", body: payload });
    const itemId = result?.response?.item_id;
    if (!itemId) throw new Error("A Shopee não retornou o código do anúncio.");
    await saveLink(product.id, { shopee_item_id: Number(itemId), status: "publicado", ultimo_erro: null });
    return itemId;
  } catch (error) {
    await saveLink(product.id, { status: "erro", ultimo_erro: error.message });
    throw error;
  }
}

export async function syncProduct(productId) {
  const supabase = createSupabaseAdminClient();
  const { data: link, error } = await supabase.from("shopee_produtos").select("*").eq("produto_id", productId).maybeSingle();
  if (error) throw error;
  if (!link?.shopee_item_id) return null;
  const product = await getProductById(productId);
  if (!product) return null;
  const variations = (product.produto_variacoes || []).filter(v => v.ativo !== false);

  if (!variations.length) {
    await api("/api/v2/product/update_price", { method: "POST", body: {
      item_id: Number(link.shopee_item_id),
      price_list: [{ model_id: 0, original_price: Number(product.preco_final || product.preco || 0) }],
    }});
    await api("/api/v2/product/update_stock", { method: "POST", body: {
      item_id: Number(link.shopee_item_id),
      stock_list: [{ model_id: 0, seller_stock: [{ stock: stockValue(product.quantidade) }] }],
    }});
  }
  await saveLink(productId, { status: "sincronizado", ultimo_erro: null });
  return true;
}

export async function getPublishedLinks() {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("shopee_produtos").select("*");
  if (error) throw error;
  return data || [];
}
