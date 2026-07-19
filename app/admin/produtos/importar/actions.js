"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { parseCsv } from "@/lib/csv";
import { requireAdmin } from "@/lib/admin-auth";

const MAX_FILE_SIZE = 900 * 1024;
const MAX_ROWS = 1500;

function slugify(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeKey(value) {
  return slugify(value).replace(/-/g, " ");
}

function parseBoolean(value, fallback = false) {
  if (value === undefined || value === null || String(value).trim() === "") return fallback;
  return ["1", "true", "sim", "s", "yes", "ativo"].includes(String(value).trim().toLowerCase());
}

function parseMoney(value) {
  let normalized = String(value ?? "")
    .trim()
    .replace(/r\$/gi, "")
    .replace(/\s/g, "")
    .replace(/[^0-9,.-]/g, "");

  if (!normalized || normalized === "-") return null;

  if (normalized.includes(",") && normalized.includes(".")) {
    if (normalized.lastIndexOf(",") > normalized.lastIndexOf(".")) {
      normalized = normalized.replace(/\./g, "").replace(",", ".");
    } else {
      normalized = normalized.replace(/,/g, "");
    }
  } else if (normalized.includes(",")) {
    normalized = normalized.replace(",", ".");
  }

  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

function parseInteger(value, fallback = 0) {
  const number = Number.parseInt(String(value ?? "").trim(), 10);
  return Number.isFinite(number) ? Math.max(0, number) : fallback;
}

function uniqueSlug(baseValue, usedSlugs) {
  const base = slugify(baseValue) || "produto";
  let candidate = base;
  let counter = 2;

  while (usedSlugs.has(candidate)) {
    candidate = `${base}-${counter}`;
    counter += 1;
  }

  usedSlugs.add(candidate);
  return candidate;
}

function chunks(items, size = 100) {
  const output = [];
  for (let index = 0; index < items.length; index += size) {
    output.push(items.slice(index, index + size));
  }
  return output;
}

async function ensureCategories(supabase, rows) {
  const { data: existing, error } = await supabase
    .from("categorias")
    .select("id, nome, slug, ordem, ativo");

  if (error) throw error;

  const categoryMap = new Map();
  const usedSlugs = new Set();

  for (const category of existing || []) {
    categoryMap.set(normalizeKey(category.nome), category);
    categoryMap.set(normalizeKey(category.slug), category);
    usedSlugs.add(category.slug);
  }

  const requested = [...new Set(rows.map((row) => String(row.categoria || "").trim()).filter(Boolean))];
  let nextOrder = (existing || []).reduce((max, category) => Math.max(max, Number(category.ordem) || 0), 0) + 1;

  for (const name of requested) {
    const key = normalizeKey(name);
    if (categoryMap.has(key)) continue;

    const slug = uniqueSlug(name, usedSlugs);
    const { data, error: insertError } = await supabase
      .from("categorias")
      .insert({ nome: name, slug, ordem: nextOrder, ativo: true })
      .select("id, nome, slug, ordem, ativo")
      .single();

    if (insertError) throw insertError;
    categoryMap.set(key, data);
    categoryMap.set(normalizeKey(data.slug), data);
    nextOrder += 1;
  }

  return categoryMap;
}

export async function importProductsAction(_previousState, formData) {
  await requireAdmin();
  const file = formData.get("arquivo");

  if (!file || typeof file.text !== "function" || file.size === 0) {
    return { ok: false, message: "Selecione uma planilha CSV.", errors: [] };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { ok: false, message: "O arquivo deve ter no máximo 900 KB.", errors: [] };
  }

  try {
    const parsed = parseCsv(await file.text());
    const requiredHeaders = ["nome", "categoria", "preco"];
    const missingHeaders = requiredHeaders.filter((header) => !parsed.headers.includes(header));

    if (missingHeaders.length) {
      return {
        ok: false,
        message: `Faltam as colunas obrigatórias: ${missingHeaders.join(", ")}.`,
        errors: [],
      };
    }

    if (parsed.rows.length > MAX_ROWS) {
      return { ok: false, message: `Importe no máximo ${MAX_ROWS} produtos por arquivo.`, errors: [] };
    }

    const validRows = [];
    const rowErrors = [];

    for (const row of parsed.rows) {
      const nome = String(row.nome || "").trim();
      const categoria = String(row.categoria || "").trim();
      const preco = parseMoney(row.preco);

      if (!nome || !categoria || preco === null || preco < 0) {
        rowErrors.push(`Linha ${row.__line}: informe nome, categoria e preço válido.`);
        continue;
      }

      validRows.push({ ...row, nome, categoria, preco });
    }

    if (!validRows.length) {
      return { ok: false, message: "Nenhum produto válido foi encontrado.", errors: rowErrors.slice(0, 25) };
    }

    const supabase = createSupabaseAdminClient();
    const categoryMap = await ensureCategories(supabase, validRows);
    const { data: existingProducts, error: productsError } = await supabase
      .from("produtos")
      .select("*");

    if (productsError) throw productsError;

    const existingBySku = new Map();
    const usedSlugs = new Set();

    for (const product of existingProducts || []) {
      if (product.sku) existingBySku.set(String(product.sku).trim().toLowerCase(), product);
      if (product.slug) usedSlugs.add(product.slug);
    }

    const toInsert = [];
    const toUpdate = [];

    for (const row of validRows) {
      const sku = String(row.sku || "").trim() || null;
      const existing = sku ? existingBySku.get(sku.toLowerCase()) : null;
      const category = categoryMap.get(normalizeKey(row.categoria));

      if (!category) {
        rowErrors.push(`Linha ${row.__line}: categoria não encontrada.`);
        continue;
      }

      let slug = existing?.slug;
      if (!slug || (row.slug && slugify(row.slug) !== slug)) {
        if (existing?.slug) usedSlugs.delete(existing.slug);
        slug = uniqueSlug(row.slug || row.nome, usedSlugs);
      }

      const record = {
        nome: row.nome,
        slug,
        categoria_id: category.id,
        descricao_curta: String(row.descricao_curta || "").trim() || null,
        descricao: String(row.descricao || "").trim() || null,
        preco: row.preco,
        preco_promocional: parseMoney(row.preco_promocional),
        quantidade: parseInteger(row.quantidade, 0),
        sku,
        codigo_barras: String(row.codigo_barras || "").trim() || null,
        imagem_principal: String(row.imagem_url || row.imagem_principal || "").trim() || null,
        meta_title: String(row.meta_title || row.nome).trim(),
        meta_description: String(row.meta_description || "").trim() || null,
        ativo: parseBoolean(row.ativo, true),
        destaque: parseBoolean(row.destaque),
        promocao: parseBoolean(row.promocao),
        novo: parseBoolean(row.novo),
        mais_vendido: parseBoolean(row.mais_vendido),
      };

      if (existing) {
        toUpdate.push({ ...existing, ...record, id: existing.id });
      } else {
        toInsert.push(record);
      }
    }

    for (const batch of chunks(toInsert)) {
      const { error } = await supabase.from("produtos").insert(batch);
      if (error) throw error;
    }

    for (const batch of chunks(toUpdate)) {
      const { error } = await supabase.from("produtos").upsert(batch, { onConflict: "id" });
      if (error) throw error;
    }

    revalidatePath("/");
    revalidatePath("/catalogo");
    revalidatePath("/categoria/[slug]", "page");
    revalidatePath("/admin/produtos");
    revalidatePath("/admin/categorias");

    return {
      ok: true,
      message: "Importação concluída.",
      inserted: toInsert.length,
      updated: toUpdate.length,
      ignored: rowErrors.length,
      errors: rowErrors.slice(0, 25),
    };
  } catch (error) {
    console.error("Erro ao importar produtos:", error);
    return {
      ok: false,
      message: error?.message || "Não foi possível importar a planilha.",
      errors: [],
    };
  }
}
