"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createProduct,
  getProductBySlug,
  updateProduct,
} from "@/modules/products/product.service";
import { uploadImageToCloudinary } from "@/services/cloudinary/upload";
import { requireAdmin } from "@/lib/admin-auth";

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

export async function createProductAction(formData) {
  await requireAdmin();
  const nome = formData.get("nome");
  const categoriaId = formData.get("categoria_id");

  if (!nome || !categoriaId) {
    throw new Error("Nome e categoria são obrigatórios.");
  }

  // Upload da imagem
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

  categoria_id: categoriaId,

  descricao_curta: formData.get("descricao_curta") || null,
  descricao: formData.get("descricao") || null,

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

  revalidatePath("/");
  revalidatePath("/catalogo");
  revalidatePath("/categoria/[slug]", "page");
  revalidatePath("/admin/produtos");
  redirect("/admin/produtos");
}

export async function updateProductCategoryAction(formData) {
  await requireAdmin();
  const produtoId = formData.get("produto_id");
  const categoriaId = formData.get("categoria_id");

  if (!produtoId) {
    throw new Error("Produto não encontrado.");
  }

  await updateProduct(produtoId, {
    categoria_id: categoriaId || null,
  });

  revalidatePath("/");
  revalidatePath("/catalogo");
  revalidatePath("/categoria/[slug]", "page");
  revalidatePath("/admin/produtos");
}
