const KEY = "prazer_discreto_carrinho";

export function cartItemKey(productId, variationId = "") {
  return `${String(productId)}:${String(variationId || "produto")}`;
}

export function getCart() {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) => ({
      ...item,
      cart_key: item.cart_key || cartItemKey(item.id, item.variacao_id),
    }));
  } catch {
    return [];
  }
}

export function saveCart(items) {
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("cart-updated"));
}

export function addToCart(product, quantity = 1, variation = null) {
  const cart = getCart();
  const variationId = variation?.id || null;
  const key = cartItemKey(product.id, variationId);
  const index = cart.findIndex((item) => item.cart_key === key);

  if (index >= 0) {
    cart[index].quantidade += quantity;
  } else {
    cart.push({
      cart_key: key,
      id: product.id,
      slug: product.slug,
      nome: product.nome,
      imagem_principal: variation?.imagem_url || product.imagem_principal,
      preco: Number(variation?.preco_final ?? product.preco_final ?? product.preco ?? 0),
      quantidade: quantity,
      variacao_id: variationId,
      variacao_nome: variation?.nome || null,
      opcao_principal: variation?.principal === true,
    });
  }

  saveCart(cart);
}

export function cartCount() {
  return getCart().reduce((total, item) => total + item.quantidade, 0);
}
