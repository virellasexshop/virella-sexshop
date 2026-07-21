import * as repository from "./repository";
import {
  enrichProductsWithPromotions,
  getPromotionSettings,
} from "@/modules/promotions/promotion.service";
import { enrichProductPricing } from "@/lib/pricing";

async function enrichProductDetails(product) {
  if (!product) return null;
  const settings = await getPromotionSettings();
  const enriched = enrichProductPricing(product, settings);

  return {
    ...enriched,
    produto_variacoes: (product.produto_variacoes || []).map((variation) => {
      const variationProduct = {
        ...product,
        preco: variation.preco ?? product.preco,
        preco_promocional: variation.preco == null ? product.preco_promocional : null,
      };
      const pricing = enrichProductPricing(variationProduct, settings);
      return {
        ...variation,
        preco_original: pricing.preco_original,
        preco_final: pricing.preco_final,
        em_promocao: pricing.em_promocao,
        desconto_percentual: pricing.desconto_percentual,
      };
    }),
  };
}

export async function getAdminProducts() {
  return repository.findAll();
}

export async function getCatalogProducts() {
  return enrichProductsWithPromotions(await repository.findAll());
}

export async function getProductById(id) {
  return enrichProductDetails(await repository.findById(id));
}

export async function createProduct(values) {
  return repository.createProduct(values);
}

export async function updateProduct(id, values) {
  return repository.updateProduct(id, values);
}

export async function deleteProduct(id) {
  return repository.deleteProduct(id);
}
export async function getProductBySlug(slug) {
  return enrichProductDetails(await repository.findBySlug(slug));
}
export async function getFeaturedProducts() {
  return enrichProductsWithPromotions(await repository.findFeaturedProducts());
}

export async function getProductsByCategorySlug(slug) {
  const result = await repository.findProductsByCategorySlug(slug);
  return {
    ...result,
    produtos: await enrichProductsWithPromotions(result.produtos),
  };
}
export async function getBestSellerProducts() {
  return enrichProductsWithPromotions(await repository.findBestSellerProducts());
}

export async function getNewProducts() {
  return enrichProductsWithPromotions(await repository.findNewProducts());
}
export async function getProductsByCategoryId(categoryId) {
  return enrichProductsWithPromotions(await repository.findProductsByCategoryId(categoryId));
}

export async function getProductsByIds(ids) {
  return enrichProductsWithPromotions(await repository.findByIds(ids));
}

export async function getVariantsByIds(ids) {
  return repository.findVariantsByIds(ids);
}

export async function getVariantsByProductIds(productIds) {
  return repository.findVariantsByProductIds(productIds);
}

export async function createProductImages(productId, images) {
  return repository.createProductImages(productId, images);
}

export async function deleteProductImage(id) {
  return repository.deleteProductImage(id);
}

export async function createProductVariations(productId, variations) {
  return repository.createProductVariations(productId, variations);
}

export async function updateProductVariation(id, values) {
  return repository.updateProductVariation(id, values);
}

export async function deleteProductVariation(id) {
  return repository.deleteProductVariation(id);
}
