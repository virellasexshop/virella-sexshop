function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

export function calculateProductPricing(product, settings = {}) {
  const original = Math.max(0, Number(product?.preco || 0));
  const promotional = Number(product?.preco_promocional || 0);
  const individualActive = product?.promocao === true;
  const globalActive = settings?.promocao_global_ativa === true;
  const globalPercentage = Math.min(
    99.99,
    Math.max(0, Number(settings?.desconto_global_percentual || 0))
  );

  let finalPrice = original;
  let promotionType = null;

  if (individualActive && promotional > 0 && promotional < finalPrice) {
    finalPrice = promotional;
    promotionType = "individual";
  }

  if (globalActive && globalPercentage > 0) {
    const globalPrice = roundMoney(original * (1 - globalPercentage / 100));
    if (globalPrice < finalPrice) {
      finalPrice = globalPrice;
      promotionType = "global";
    }
  }

  finalPrice = roundMoney(finalPrice);
  const onSale = finalPrice < original;
  const discountPercentage = onSale && original > 0
    ? Math.round((1 - finalPrice / original) * 100)
    : 0;

  return {
    originalPrice: roundMoney(original),
    finalPrice,
    onSale,
    discountPercentage,
    promotionType,
  };
}

export function enrichProductPricing(product, settings = {}) {
  const pricing = calculateProductPricing(product, settings);
  return {
    ...product,
    preco_original: pricing.originalPrice,
    preco_final: pricing.finalPrice,
    em_promocao: pricing.onSale,
    desconto_percentual: pricing.discountPercentage,
    tipo_promocao: pricing.promotionType,
  };
}
