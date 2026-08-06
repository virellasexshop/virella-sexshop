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
    pacotes: Array.isArray(item.packages)
      ? item.packages.map((packageItem) => ({
          height: positiveNumber(packageItem.height, DEFAULT_PACKAGE.height),
          width: positiveNumber(packageItem.width, DEFAULT_PACKAGE.width),
          length: positiveNumber(packageItem.length, DEFAULT_PACKAGE.length),
          weight: positiveNumber(packageItem.weight, DEFAULT_PACKAGE.weight),
        }))
      : [],
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
    pacotes: Array.isArray(quote.pacotes) ? quote.pacotes : [],
  };

  return {
    ...checkout,
    frete: shipping.preco,
    total: roundMoney(checkout.subtotal + shipping.preco),
    frete_selecionado: shipping,
  };
}


function onlyDigits(value, maxLength = 30) {
  return String(value || "").replace(/\D/g, "").slice(0, maxLength);
}

function cleanRequired(value, label, maxLength = 160) {
  const text = String(value || "").trim().slice(0, maxLength);
  if (!text) throw new Error(`Configure ${label} nas variáveis da Vercel.`);
  return text;
}

function senderFromEnvironment(configuration) {
  const document = onlyDigits(process.env.MELHOR_ENVIO_REMETENTE_CPF, 11);
  const companyDocument = onlyDigits(process.env.MELHOR_ENVIO_REMETENTE_CNPJ, 14);
  if (!document && !companyDocument) {
    throw new Error("Configure MELHOR_ENVIO_REMETENTE_CPF ou MELHOR_ENVIO_REMETENTE_CNPJ na Vercel.");
  }

  return {
    name: cleanRequired(process.env.MELHOR_ENVIO_REMETENTE_NOME, "MELHOR_ENVIO_REMETENTE_NOME"),
    email: cleanRequired(process.env.MELHOR_ENVIO_REMETENTE_EMAIL, "MELHOR_ENVIO_REMETENTE_EMAIL"),
    phone: onlyDigits(cleanRequired(process.env.MELHOR_ENVIO_REMETENTE_TELEFONE, "MELHOR_ENVIO_REMETENTE_TELEFONE"), 15),
    ...(document ? { document } : {}),
    ...(companyDocument ? { company_document: companyDocument } : {}),
    state_register: String(process.env.MELHOR_ENVIO_REMETENTE_IE || "ISENTO").trim() || "ISENTO",
    ...(process.env.MELHOR_ENVIO_REMETENTE_CNAE
      ? { economic_activity_code: onlyDigits(process.env.MELHOR_ENVIO_REMETENTE_CNAE, 12) }
      : {}),
    address: cleanRequired(process.env.MELHOR_ENVIO_REMETENTE_RUA, "MELHOR_ENVIO_REMETENTE_RUA"),
    complement: String(process.env.MELHOR_ENVIO_REMETENTE_COMPLEMENTO || "").trim().slice(0, 100),
    number: cleanRequired(process.env.MELHOR_ENVIO_REMETENTE_NUMERO, "MELHOR_ENVIO_REMETENTE_NUMERO", 30),
    district: cleanRequired(process.env.MELHOR_ENVIO_REMETENTE_BAIRRO, "MELHOR_ENVIO_REMETENTE_BAIRRO", 100),
    city: cleanRequired(process.env.MELHOR_ENVIO_REMETENTE_CIDADE, "MELHOR_ENVIO_REMETENTE_CIDADE", 100),
    postal_code: configuration.originPostalCode,
    state_abbr: cleanRequired(process.env.MELHOR_ENVIO_REMETENTE_ESTADO, "MELHOR_ENVIO_REMETENTE_ESTADO", 2).toUpperCase(),
  };
}

function destinationFromOrder(order) {
  const document = onlyDigits(order.cliente_documento, 14);
  if (document.length !== 11 && document.length !== 14) {
    throw new Error("O pedido não possui um CPF/CNPJ válido do destinatário.");
  }

  return {
    name: cleanRequired(order.cliente_nome, "o nome do cliente"),
    email: cleanRequired(order.cliente_email, "o e-mail do cliente"),
    phone: onlyDigits(order.cliente_telefone, 15),
    ...(document.length === 11 ? { document } : { company_document: document }),
    state_register: "ISENTO",
    address: cleanRequired(order.endereco_rua, "a rua do cliente"),
    complement: String(order.endereco_complemento || "").trim().slice(0, 100),
    number: cleanRequired(order.endereco_numero, "o número do endereço", 30),
    district: cleanRequired(order.endereco_bairro, "o bairro do cliente", 100),
    city: cleanRequired(order.endereco_cidade, "a cidade do cliente", 100),
    postal_code: cleanPostalCode(order.endereco_cep),
    country_id: "BR",
    state_abbr: cleanRequired(order.endereco_estado, "o estado do cliente", 2).toUpperCase(),
  };
}

function fallbackVolumes(items) {
  let weight = 0;
  let height = 0;
  let width = DEFAULT_PACKAGE.width;
  let length = DEFAULT_PACKAGE.length;

  for (const item of items || []) {
    const quantity = Math.max(1, Math.trunc(Number(item.quantidade || 1)));
    const logistics = item.logistica || {};
    weight += positiveNumber(logistics.peso_kg, DEFAULT_PACKAGE.weight) * quantity;
    height += positiveNumber(logistics.altura_cm, DEFAULT_PACKAGE.height) * quantity;
    width = Math.max(width, positiveNumber(logistics.largura_cm, DEFAULT_PACKAGE.width));
    length = Math.max(length, positiveNumber(logistics.comprimento_cm, DEFAULT_PACKAGE.length));
  }

  return [{
    height: Math.max(DEFAULT_PACKAGE.height, Math.min(100, Math.ceil(height))),
    width: Math.ceil(width),
    length: Math.ceil(length),
    weight: Math.max(0.1, Math.round(weight * 1000) / 1000),
  }];
}

async function melhorEnvioRequest(path, { method = "POST", body } = {}) {
  const configuration = getConfiguration();
  let response;
  try {
    response = await fetch(`${configuration.baseUrl}${path}`, {
      method,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${configuration.token}`,
        "User-Agent": configuration.userAgent,
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      cache: "no-store",
      signal: AbortSignal.timeout(30000),
    });
  } catch (error) {
    if (error?.name === "TimeoutError" || error?.name === "AbortError") {
      throw new Error("O Melhor Envio demorou para responder. Tente novamente.");
    }
    throw new Error("Não foi possível conectar ao Melhor Envio.");
  }

  const result = await response.json().catch(() => null);
  if (!response.ok) {
    const details = result?.message || result?.error || result?.errors;
    const message = typeof details === "string"
      ? details
      : details && typeof details === "object"
        ? Object.values(details).flat().join(" ").slice(0, 350)
        : responseMessage(result, response.status);
    throw new Error(message || "O Melhor Envio recusou a operação.");
  }
  return result;
}

function extractPrintUrl(result) {
  if (typeof result === "string" && /^https?:\/\//.test(result)) return result;
  return result?.url || result?.link || result?.data?.url || result?.data?.link || null;
}

export async function createShippingLabelCart({ order, items, invoiceKey = "" }) {
  if (order.status_pagamento !== "aprovado") {
    throw new Error("A etiqueta só pode ser emitida depois que o pagamento for aprovado.");
  }
  if (!order.frete_servico_id) throw new Error("Este pedido não possui um serviço de entrega selecionado.");

  const configuration = getConfiguration();
  const invoice = onlyDigits(invoiceKey, 44);
  if (invoice && invoice.length !== 44) throw new Error("A chave da NF-e precisa ter 44 números.");

  const products = (items || []).map((item) => ({
    name: String(item.nome || "Produto").slice(0, 100),
    quantity: Math.max(1, Math.trunc(Number(item.quantidade || 1))),
    unitary_value: roundMoney(item.preco_unitario),
  }));
  if (!products.length) throw new Error("O pedido não possui itens para envio.");

  const storedVolumes = Array.isArray(order.frete_pacotes) ? order.frete_pacotes : [];
  const volumes = storedVolumes.length ? storedVolumes : fallbackVolumes(items);
  const site = String(process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "").replace(/\/$/, "");
  const cartPayload = {
    service: Number(order.frete_servico_id),
    from: senderFromEnvironment(configuration),
    to: destinationFromOrder(order),
    products,
    volumes,
    options: {
      platform: "Virella Sex Shop",
      reminder: `Pedido #${order.numero}`,
      insurance_value: roundMoney(order.subtotal || order.total),
      receipt: false,
      own_hand: false,
      reverse: false,
      ...(invoice ? { invoice: { key: invoice } } : {}),
      tags: [{ tag: `Pedido #${order.numero}`, url: site ? `${site}/admin/pedidos` : null }],
    },
  };

  const cartResult = await melhorEnvioRequest("/api/v2/me/cart", { body: cartPayload });
  const shipmentId = String(cartResult?.id || cartResult?.order?.id || "");
  if (!shipmentId) throw new Error("O Melhor Envio não retornou o identificador da etiqueta.");
  return { shipmentId, invoiceKey: invoice || null };
}

export async function checkoutShippingLabel(shipmentId) {
  return melhorEnvioRequest("/api/v2/me/shipment/checkout", { body: { orders: [shipmentId] } });
}

export async function generateShippingLabel(shipmentId) {
  return melhorEnvioRequest("/api/v2/me/shipment/generate", { body: { orders: [shipmentId] } });
}

export async function printShippingLabel(shipmentId) {
  let lastError = null;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    if (attempt > 0) await new Promise((resolve) => setTimeout(resolve, 1600));
    try {
      const result = await melhorEnvioRequest("/api/v2/me/shipment/print", {
        body: { mode: "public", orders: [shipmentId] },
      });
      const printUrl = extractPrintUrl(result);
      if (printUrl) return printUrl;
      lastError = new Error("O link de impressão ainda não está disponível.");
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error("A etiqueta foi gerada, mas o link de impressão não foi retornado.");
}

