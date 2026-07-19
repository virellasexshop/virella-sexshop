import * as repository from "./repository";
import {
  enrichProductWithPromotions,
  enrichProductsWithPromotions,
} from "@/modules/promotions/promotion.service";

export async function getAdminProducts() {
  return repository.findAll();
}

export async function getCatalogProducts() {
  return enrichProductsWithPromotions(await repository.findAll());
}

export async function getProductById(id) {
  return enrichProductWithPromotions(await repository.findById(id));
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
  return enrichProductWithPromotions(await repository.findBySlug(slug));
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
