import "server-only";

import {
  getProductsByIds,
  getVariantsByProductIds,
} from "@/modules/products/product.service";
import { getPromotionSettings } from "@/modules/promotions/promotion.service";
import { enrichProductPricing } from "@/lib/pricing";

const MAX_DIFFERENT_PRODUCTS = 50;
const MAX_QUANTITY_PER_PRODUCT = 20;

function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function cleanText(value, maxLength = 160) {
  return String(value || "").trim().slice(0, maxLength);
}

function cartKey(productId, variationId = "") {
  return `${productId}:${variationId || "produto"}`;
}

function normalizeCart(rawItems) {
  if (!Array.isArray(rawItems)) return [];

  const quantities = new Map();
  for (const item of rawItems.slice(0, MAX_DIFFERENT_PRODUCTS)) {
    const id = cleanText(item?.id, 80);
    const variationId = cleanText(item?.variacao_id, 80) || null;
    const mainOption = item?.opcao_principal === true;
    const quantity = Math.min(
      MAX_QUANTITY_PER_PRODUCT,
      Math.max(1, Math.trunc(Number(item?.quantidade || item?.quantity || 1)))
    );
    if (!id) continue;

    const key = cartKey(id, variationId);
    const current = quantities.get(key) || {
      id,
      variacao_id: variationId,
      opcao_principal: mainOption,
      quantidade: 0,
    };
    current.quantidade = Math.min(MAX_QUANTITY_PER_PRODUCT, current.quantidade + quantity);
    quantities.set(key, current);
  }

  return [...quantities.values()];
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

  const productIds = [...new Set(cart.map((item) => item.id))];
  const [products, variations, promotionSettings] = await Promise.all([
    getProductsByIds(productIds),
    getVariantsByProductIds(productIds),
    getPromotionSettings(),
  ]);
  const productMap = new Map(products.map((product) => [String(product.id), product]));
  const variationMap = new Map(variations.map((variation) => [String(variation.id), variation]));
  const variationsByProduct = new Map();

  for (const variation of variations.filter((item) => item.ativo !== false)) {
    const key = String(variation.produto_id);
    variationsByProduct.set(key, [...(variationsByProduct.get(key) || []), variation]);
  }

  const items = cart.map((cartItem) => {
    const product = productMap.get(String(cartItem.id));
    if (!product || product.ativo === false) {
      throw new Error("Um produto do carrinho não está mais disponível.");
    }

    const productVariations = variationsByProduct.get(String(product.id)) || [];
    let variation = null;

    if (cartItem.variacao_id) {
      variation = variationMap.get(String(cartItem.variacao_id));
      if (!variation || String(variation.produto_id) !== String(product.id) || variation.ativo === false) {
        throw new Error(`A opção escolhida para ${product.nome} não está mais disponível.`);
      }
    } else if (productVariations.length > 0 && !(
      cartItem.opcao_principal && product.opcao_principal_nome
    )) {
      throw new Error(`Escolha uma variação para ${product.nome}.`);
    }

    const pricedProduct = variation
      ? enrichProductPricing({
          ...product,
          preco: variation.preco ?? product.preco,
          preco_promocional: variation.preco == null ? product.preco_promocional : null,
        }, promotionSettings)
      : product;
    const unitPrice = roundMoney(pricedProduct.preco_final ?? pricedProduct.preco);
    if (unitPrice <= 0) throw new Error(`Preço inválido para ${product.nome}.`);

    return {
      produto_id: String(product.id),
      variacao_id: variation?.id || null,
      variacao_nome: variation?.nome || (cartItem.opcao_principal ? product.opcao_principal_nome : null),
      nome: variation
        ? `${product.nome} — ${variation.nome}`
        : cartItem.opcao_principal && product.opcao_principal_nome
          ? `${product.nome} — ${product.opcao_principal_nome}`
          : product.nome,
      imagem_url: variation?.imagem_url || product.imagem_principal || null,
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
