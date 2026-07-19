import "server-only";

import { getProductsByIds } from "@/modules/products/product.service";

const MAX_DIFFERENT_PRODUCTS = 50;
const MAX_QUANTITY_PER_PRODUCT = 20;

function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function cleanText(value, maxLength = 160) {
  return String(value || "").trim().slice(0, maxLength);
}

function normalizeCart(rawItems) {
  if (!Array.isArray(rawItems)) return [];

  const quantities = new Map();
  for (const item of rawItems.slice(0, MAX_DIFFERENT_PRODUCTS)) {
    const id = cleanText(item?.id, 80);
    const quantity = Math.min(
      MAX_QUANTITY_PER_PRODUCT,
      Math.max(1, Math.trunc(Number(item?.quantidade || item?.quantity || 1)))
    );
    if (id) quantities.set(id, Math.min(MAX_QUANTITY_PER_PRODUCT, (quantities.get(id) || 0) + quantity));
  }

  return [...quantities].map(([id, quantidade]) => ({ id, quantidade }));
}

export function validateCustomer(rawCustomer = {}) {
  const customer = {
    nome: cleanText(rawCustomer.nome, 100),
    email: cleanText(rawCustomer.email, 160).toLowerCase(),
    telefone: cleanText(rawCustomer.telefone, 30).replace(/[^0-9+() -]/g, ""),
    cep: cleanText(rawCustomer.cep, 9).replace(/\D/g, ""),
    rua: cleanText(rawCustomer.rua, 160),
    numero: cleanText(rawCustomer.numero, 30),
    complemento: cleanText(rawCustomer.complemento, 100),
    bairro: cleanText(rawCustomer.bairro, 100),
    cidade: cleanText(rawCustomer.cidade, 100),
    estado: cleanText(rawCustomer.estado, 2).toUpperCase(),
  };

  if (customer.nome.length < 3) throw new Error("Informe o nome completo.");
  if (!/^\S+@\S+\.\S+$/.test(customer.email)) throw new Error("Informe um e-mail válido.");
  if (customer.cep.length !== 8) throw new Error("Informe um CEP válido.");
  if (!customer.rua || !customer.numero || !customer.bairro || !customer.cidade) {
    throw new Error("Preencha o endereço completo.");
  }
  if (!/^[A-Z]{2}$/.test(customer.estado)) throw new Error("Informe a UF com duas letras.");

  return customer;
}

export async function calculateCheckout(rawItems) {
  const cart = normalizeCart(rawItems);
  if (!cart.length) throw new Error("Seu carrinho está vazio.");

  const products = await getProductsByIds(cart.map((item) => item.id));
  const productMap = new Map(products.map((product) => [String(product.id), product]));

  const items = cart.map((cartItem) => {
    const product = productMap.get(String(cartItem.id));
    if (!product || product.ativo === false) throw new Error("Um produto do carrinho não está mais disponível.");

    const available = Number(product.quantidade);
    if (Number.isFinite(available) && available >= 0 && cartItem.quantidade > available) {
      throw new Error(`Estoque insuficiente para ${product.nome}.`);
    }

    const unitPrice = roundMoney(product.preco_final ?? product.preco);
    if (unitPrice <= 0) throw new Error(`Preço inválido para ${product.nome}.`);

    return {
      produto_id: String(product.id),
      nome: product.nome,
      imagem_url: product.imagem_principal || null,
      quantidade: cartItem.quantidade,
      preco_unitario: unitPrice,
      total: roundMoney(unitPrice * cartItem.quantidade),
    };
  });

  const subtotal = roundMoney(items.reduce((sum, item) => sum + item.total, 0));
  const flatShipping = Math.max(0, Number(process.env.VIRELLA_FRETE_FIXO || 0));
  const freeAbove = Math.max(0, Number(process.env.VIRELLA_FRETE_GRATIS_ACIMA || 0));
  const frete = freeAbove > 0 && subtotal >= freeAbove ? 0 : roundMoney(flatShipping);

  return { items, subtotal, frete, total: roundMoney(subtotal + frete) };
}
