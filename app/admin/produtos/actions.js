"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createProduct,
  createProductImages,
  createProductVariations,
  deleteProduct,
  deleteProductImage,
  deleteProductVariation,
  getProductBySlug,
  updateProduct,
  updateProductVariation,
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

function isImageFile(value) {
  return value && typeof value.arrayBuffer === "function" && Number(value.size || 0) > 0;
}

function parseVariations(formData) {
  let raw = [];
  try {
    raw = JSON.parse(String(formData.get("variacoes_json") || "[]"));
  } catch {
    throw new Error("As variações enviadas são inválidas.");
  }

  if (!Array.isArray(raw)) return [];
  if (raw.length > 30) throw new Error("Cadastre no máximo 30 variações por produto.");

  return raw.map((variation, index) => {
    const nome = String(variation?.nome || "").trim().slice(0, 100);
    const rawPrice = String(variation?.preco || "").trim();
    const preco = rawPrice ? toNumber(rawPrice) : null;

    if (!nome) throw new Error(`Informe o nome da variação ${index + 1}.`);
    if (preco != null && (!Number.isFinite(preco) || preco < 0)) {
      throw new Error(`O preço da variação ${nome} é inválido.`);
    }

    return {
      nome,
      sku: String(variation?.sku || "").trim().slice(0, 80) || null,
      preco,
      quantidade: 0,
      ativo: true,
      ordem: index,
    };
  });
}

export async function updateProductCategoryAction(formData) {
  await requireAdmin();
  const id = getProductId(formData);
  const categoriaId = String(formData.get("categoria_id") || "").trim();

  await updateProduct(id, { categoria_id: categoriaId || null });
  revalidateProducts();
}

export async function toggleProductStatusAction(formData) {
  await requireAdmin();
  const id = getProductId(formData);
  const ativo = String(formData.get("ativo")) === "true";

  await updateProduct(id, { ativo: !ativo });
  revalidateProducts();
}

export async function deleteProductAction(formData) {
  await requireAdmin();
  const id = getProductId(formData);

  await deleteProduct(id);
  revalidateProducts();
}

export async function updateMainOptionAction(formData) {
  await requireAdmin();
  const productId = getProductId(formData);
  const nome = String(formData.get("opcao_principal_nome") || "").trim().slice(0, 100);

  if (!nome) throw new Error("Informe o nome da opção principal.");

  await updateProduct(productId, {
    opcao_principal_nome: nome,
  });
  revalidateProducts();
}

export async function addProductImagesAction(formData) {
  await requireAdmin();
  const productId = getProductId(formData);
  const files = formData.getAll("imagens").filter(isImageFile).slice(0, 12);
  if (!files.length) throw new Error("Selecione pelo menos uma imagem.");

  const totalSize = files.reduce((total, file) => total + Number(file.size || 0), 0);
  if (totalSize > 3.5 * 1024 * 1024) {
    throw new Error("As imagens juntas ultrapassam 3,5 MB.");
  }

  const images = [];
  for (let index = 0; index < files.length; index++) {
    images.push({ url: await uploadImageToCloudinary(files[index]), ordem: index + 100 });
  }
  await createProductImages(productId, images);
  revalidateProducts();
}

export async function deleteProductImageAction(formData) {
  await requireAdmin();
  const imageId = String(formData.get("imagem_id") || "").trim();
  if (!imageId) throw new Error("Imagem inválida.");
  await deleteProductImage(imageId);
  revalidateProducts();
}

export async function createVariationAction(formData) {
  await requireAdmin();
  const productId = getProductId(formData);
  const nome = String(formData.get("nome") || "").trim().slice(0, 100);
  const priceText = String(formData.get("preco") || "").trim();
  const price = priceText ? toNumber(priceText) : null;
  const imageFile = formData.get("imagem");

  if (!nome) throw new Error("Informe o nome da variação.");
  if (price != null && (!Number.isFinite(price) || price < 0)) throw new Error("Preço inválido.");

  await createProductVariations(productId, [{
    nome,
    sku: String(formData.get("sku") || "").trim() || null,
    preco: price,
    quantidade: 0,
    imagem_url: isImageFile(imageFile) ? await uploadImageToCloudinary(imageFile) : null,
    ativo: true,
    ordem: Number(formData.get("ordem") || 100),
  }]);
  revalidateProducts();
}

export async function updateVariationAction(formData) {
  await requireAdmin();
  const variationId = String(formData.get("variacao_id") || "").trim();
  const nome = String(formData.get("nome") || "").trim().slice(0, 100);
  const priceText = String(formData.get("preco") || "").trim();
  const price = priceText ? toNumber(priceText) : null;
  const imageFile = formData.get("imagem");

  if (!variationId || !nome) throw new Error("Variação inválida.");
  if (price != null && (!Number.isFinite(price) || price < 0)) throw new Error("Preço inválido.");

  const values = {
    nome,
    sku: String(formData.get("sku") || "").trim() || null,
    preco: price,
    ativo: formData.get("ativo") === "on",
  };
  if (isImageFile(imageFile)) values.imagem_url = await uploadImageToCloudinary(imageFile);

  await updateProductVariation(variationId, values);
  revalidateProducts();
}

export async function deleteVariationAction(formData) {
  await requireAdmin();
  const variationId = String(formData.get("variacao_id") || "").trim();
  if (!variationId) throw new Error("Variação inválida.");
  await deleteProductVariation(variationId);
  revalidateProducts();
}

export async function createProductAction(formData) {
  await requireAdmin();
  const nome = formData.get("nome");
  const imagemFile = formData.get("imagem_principal");
  const additionalFiles = formData.getAll("imagens_adicionais").filter(isImageFile).slice(0, 12);
  const variations = parseVariations(formData);
  const mainOptionName = String(formData.get("opcao_principal_nome") || "").trim().slice(0, 100);
  if (variations.length && !mainOptionName) {
    throw new Error("Informe o nome da opção principal.");
  }
  const variationFiles = variations.map((_, index) => formData.get(`variacao_imagem_${index}`));
  const allFiles = [imagemFile, ...additionalFiles, ...variationFiles].filter(isImageFile);
  const totalFileSize = allFiles.reduce((total, file) => total + Number(file.size || 0), 0);

  if (totalFileSize > 3.5 * 1024 * 1024) {
    throw new Error("As imagens juntas ultrapassam 3,5 MB. Comprima as fotos e tente novamente.");
  }

  let imagemUrl = null;

  if (imagemFile && imagemFile.size > 0) {
    imagemUrl = await uploadImageToCloudinary(imagemFile);
  }

  const additionalUrls = [];
  for (const file of additionalFiles) {
    additionalUrls.push(await uploadImageToCloudinary(file));
  }

  for (let index = 0; index < variations.length; index++) {
    const file = variationFiles[index];
    variations[index].imagem_url = isImageFile(file)
      ? await uploadImageToCloudinary(file)
      : null;
  }

  const slugBase = formData.get("slug") || nome;
  const slug = await createUniqueSlug(slugBase);

  const produto = {
    nome,
    slug,
    descricao_curta: formData.get("descricao_curta") || null,
    descricao: formData.get("descricao") || null,
    categoria_id: formData.get("categoria_id") || null,
    opcao_principal_nome: variations.length ? mainOptionName : null,
    preco: toNumber(formData.get("preco")),
    preco_promocional: toNumber(formData.get("preco_promocional")) || null,
    quantidade: 0,
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

  const createdProduct = await createProduct(produto);

  try {
    await Promise.all([
      createProductImages(
        createdProduct.id,
        additionalUrls.map((url, ordem) => ({ url, ordem }))
      ),
      createProductVariations(createdProduct.id, variations),
    ]);
  } catch (error) {
    await deleteProduct(createdProduct.id);
    throw error;
  }
  revalidateProducts();
  redirect("/admin/produtos");
}
