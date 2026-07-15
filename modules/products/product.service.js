import * as repository from "./repository";

export async function getAdminProducts() {
  return repository.findAll();
}

export async function getProductById(id) {
  return repository.findById(id);
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
  return repository.findBySlug(slug);
}
export async function getFeaturedProducts() {
  return repository.findFeaturedProducts();
}

export async function getProductsByCategorySlug(slug) {
  return repository.findProductsByCategorySlug(slug);
}
export async function getBestSellerProducts() {
  return repository.findBestSellerProducts();
}

export async function getNewProducts() {
  return repository.findNewProducts();
}
export async function getProductsByCategoryId(categoryId) {
  return repository.findProductsByCategoryId(categoryId);
}