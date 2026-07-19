const KEY = "prazer_discreto_carrinho";

export function getCart() {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}

export function saveCart(items) {
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("cart-updated"));
}

export function addToCart(product, quantity = 1) {
  const cart = getCart();
  const index = cart.findIndex((item) => item.id === product.id);
  if (index >= 0) cart[index].quantidade += quantity;
  else cart.push({
    id: product.id,
    slug: product.slug,
    nome: product.nome,
    imagem_principal: product.imagem_principal,
    preco: Number(product.preco_final ?? product.preco ?? 0),
    quantidade: quantity,
  });
  saveCart(cart);
}

export function cartCount() {
  return getCart().reduce((total, item) => total + item.quantidade, 0);
}
