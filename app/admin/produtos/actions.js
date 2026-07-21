"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createProduct,
  deleteProduct,
  getProductBySlug,
  updateProduct,
} from "@/modules/products/product.service";
import { uploadImageToCloudinary } from "@/services/cloudinary/upload";

function createSlug(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

async function createUniqueSlug(baseText) {
  const baseSlug = createSlug(baseText);
  let slug = baseSlug;
  let count = 1;

  while (await getProductBySlug(slug)) {
    slug = `${baseSlug}-${count}`;
    count++;
  }

  return slug;
}

function toNumber(value) {
  if (!value) return 0;
  return Number(String(value).replace(",", "."));
}

function getProductId(formData) {
  const id = String(formData.get("produto_id") || "").trim();

  if (!id) {
    throw new Error("Produto inválido.");
  }

  return id;
}

function revalidateProducts() {
  revalidatePath("/admin/produtos");
  revalidatePath("/catalogo");
  revalidatePath("/");
  revalidatePath("/categoria/[slug]", "page");
}

export async function updateProductCategoryAction(formData) {
  const id = getProductId(formData);
  const categoriaId = String(formData.get("categoria_id") || "").trim();

  await updateProduct(id, { categoria_id: categoriaId || null });
  revalidateProducts();
}

export async function updateProductStockAction(formData) {
  const id = getProductId(formData);
  const quantidade = Number(formData.get("quantidade"));

  if (!Number.isInteger(quantidade) || quantidade < 0) {
    throw new Error("O estoque deve ser um número inteiro igual ou maior que zero.");
  }

  await updateProduct(id, { quantidade });
  revalidateProducts();
}

export async function toggleProductStatusAction(formData) {
  const id = getProductId(formData);
  const ativo = String(formData.get("ativo")) === "true";

  await updateProduct(id, { ativo: !ativo });
  revalidateProducts();
}

export async function deleteProductAction(formData) {
  const id = getProductId(formData);

  await deleteProduct(id);
  revalidateProducts();
}

export async function createProductAction(formData) {
  const nome = formData.get("nome");
  const imagemFile = formData.get("imagem_principal");
  let imagemUrl = null;

  if (imagemFile && imagemFile.size > 0) {
    imagemUrl = await uploadImageToCloudinary(imagemFile);
  }

  const slugBase = formData.get("slug") || nome;
  const slug = await createUniqueSlug(slugBase);

  const produto = {
    nome,
    slug,
    descricao_curta: formData.get("descricao_curta") || null,
    descricao: formData.get("descricao") || null,
    categoria_id: formData.get("categoria_id") || null,
    preco: toNumber(formData.get("preco")),
    preco_promocional: toNumber(formData.get("preco_promocional")) || null,
    quantidade: Number(formData.get("quantidade") || 0),
    sku: formData.get("sku") || null,
    codigo_barras: formData.get("codigo_barras") || null,
    imagem_principal: imagemUrl,
    meta_title: formData.get("meta_title") || nome,
    meta_description: formData.get("meta_description") || null,
    ativo: formData.get("ativo") === "on",
    destaque: formData.get("destaque") === "on",
    promocao: formData.get("promocao") === "on",
    novo: formData.get("novo") === "on",
    mais_vendido: formData.get("mais_vendido") === "on",
  };

  await createProduct(produto);
  revalidateProducts();
  redirect("/admin/produtos");
}
