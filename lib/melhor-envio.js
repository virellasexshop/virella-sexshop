import "server-only";

const DEFAULT_PACKAGE = {
  width: 12,
  height: 8,
  length: 18,
  weight: 0.3,
};

function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function positiveNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

function cleanPostalCode(value) {
  return String(value || "").replace(/\D/g, "").slice(0, 8);
}

function getConfiguration() {
  const token = String(process.env.MELHOR_ENVIO_TOKEN || "")
    .trim()
    .replace(/^Bearer\s+/i, "");
  const originPostalCode = cleanPostalCode(process.env.MELHOR_ENVIO_CEP_ORIGEM);
  const userAgent = String(process.env.MELHOR_ENVIO_USER_AGENT || "").trim();

  if (!token) throw new Error("O token do Melhor Envio ainda não foi configurado.");
  if (originPostalCode.length !== 8) {
    throw new Error("O CEP de origem do Melhor Envio ainda não foi configurado.");
  }
  if (!userAgent || !userAgent.includes("@")) {
    throw new Error("Configure o MELHOR_ENVIO_USER_AGENT com o nome da loja e um e-mail.");
  }

  const sandbox = String(process.env.MELHOR_ENVIO_AMBIENTE || "")
    .toLowerCase() === "sandbox";

  return {
    token,
    originPostalCode,
    userAgent,
    baseUrl: sandbox
      ? "https://sandbox.melhorenvio.com.br"
      : "https://melhorenvio.com.br",
  };
}

function productPackage(item) {
  const logistics = item.logistica || {};
  return {
    id: String(item.variacao_id || item.produto_id),
    width: positiveNumber(
      logistics.largura_cm,
      positiveNumber(process.env.VIRELLA_PRODUTO_LARGURA_CM, DEFAULT_PACKAGE.width)
    ),
    height: positiveNumber(
      logistics.altura_cm,
      positiveNumber(process.env.VIRELLA_PRODUTO_ALTURA_CM, DEFAULT_PACKAGE.height)
    ),
    length: positiveNumber(
      logistics.comprimento_cm,
      positiveNumber(process.env.VIRELLA_PRODUTO_COMPRIMENTO_CM, DEFAULT_PACKAGE.length)
    ),
    weight: positiveNumber(
      logistics.peso_kg,
      positiveNumber(process.env.VIRELLA_PRODUTO_PESO_KG, DEFAULT_PACKAGE.weight)
    ),
    insurance_value: roundMoney(item.preco_unitario),
    quantity: Math.max(1, Math.trunc(Number(item.quantidade || 1))),
  };
}

function responseMessage(payload, status) {
  if (status === 401) {
    return "O token do Melhor Envio é inválido ou expirou. Atualize-o na Vercel.";
  }

  const apiMessage = payload?.message || payload?.error;
  if (typeof apiMessage === "string" && apiMessage.length < 180) return apiMessage;
  if (status === 422) {
    return "O Melhor Envio recusou os dados da cotação. Confira o CEP e as medidas dos produtos.";
  }
  return "O Melhor Envio não conseguiu calcular o frete agora. Tente novamente.";
}

function normalizeQuote(item) {
  if (!item || item.error) return null;

  const price = Number(item.custom_price ?? item.price);
  const deliveryTime = Number(item.custom_delivery_time ?? item.delivery_time);
  if (!item.id || !Number.isFinite(price) || price < 0) return null;

  const company = String(item.company?.name || "Transportadora").trim();
  const service = String(item.name || "Entrega").trim();

  return {
    id: String(item.id),
    servico: service,
    transportadora: company,
    preco_original: roundMoney(price),
    preco: roundMoney(price),
    prazo_dias: Number.isFinite(deliveryTime) && deliveryTime > 0
      ? Math.trunc(deliveryTime)
      : null,
    logo_url: item.company?.picture || null,
    gratuito: false,
  };
}

export function freeShippingThreshold() {
  return Math.max(0, Number(process.env.VIRELLA_FRETE_GRATIS_ACIMA || 299));
}

export async function quoteShipping({ items, subtotal, destinationPostalCode }) {
  const postalCode = cleanPostalCode(destinationPostalCode);
  if (postalCode.length !== 8) throw new Error("Informe um CEP válido para calcular o frete.");

  const configuration = getConfiguration();
  const services = String(process.env.MELHOR_ENVIO_SERVICOS || "").trim();
  const payload = {
    from: { postal_code: configuration.originPostalCode },
    to: { postal_code: postalCode },
    products: items.map(productPackage),
    options: { receipt: false, own_hand: false },
    ...(services ? { services } : {}),
  };

  let response;
  try {
    response = await fetch(`${configuration.baseUrl}/api/v2/me/shipment/calculate`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${configuration.token}`,
        "User-Agent": configuration.userAgent,
      },
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: AbortSignal.timeout(12000),
    });
  } catch (error) {
    if (error?.name === "TimeoutError" || error?.name === "AbortError") {
      throw new Error("A cotação demorou demais. Tente novamente em alguns segundos.");
    }
    throw new Error("Não foi possível conectar ao Melhor Envio. Tente novamente.");
  }

  const result = await response.json().catch(() => null);
  if (!response.ok) throw new Error(responseMessage(result, response.status));
  if (!Array.isArray(result)) throw new Error("O Melhor Envio retornou uma cotação inválida.");

  const quotes = result
    .map(normalizeQuote)
    .filter(Boolean)
    .sort((a, b) => a.preco - b.preco);

  if (!quotes.length) {
    throw new Error("Nenhuma transportadora atende este CEP com os produtos do carrinho.");
  }

  const threshold = freeShippingThreshold();
  const eligibleForFreeShipping = threshold > 0 && Number(subtotal) >= threshold;

  if (eligibleForFreeShipping) {
    quotes[0] = { ...quotes[0], preco: 0, gratuito: true };
  }

  return {
    opcoes: quotes,
    frete_gratis_acima: threshold,
    elegivel_frete_gratis: eligibleForFreeShipping,
  };
}

export function applyShipping(checkout, quote) {
  const shipping = {
    id: String(quote.id),
    servico: quote.servico,
    transportadora: quote.transportadora,
    preco_original: roundMoney(quote.preco_original),
    preco: roundMoney(quote.preco),
    prazo_dias: quote.prazo_dias,
    gratuito: quote.gratuito === true,
  };

  return {
    ...checkout,
    frete: shipping.preco,
    total: roundMoney(checkout.subtotal + shipping.preco),
    frete_selecionado: shipping,
  };
}
