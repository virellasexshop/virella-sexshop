import "server-only";

import { MercadoPagoConfig, Payment, Preference } from "mercadopago";

function getClient() {
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!accessToken) throw new Error("Mercado Pago ainda não foi configurado.");
  return new MercadoPagoConfig({ accessToken, options: { timeout: 10000 } });
}

function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

export async function createPaymentPreference({ order, items, customer, siteUrl }) {
  const preference = new Preference(getClient());
  const nameParts = customer.nome.split(/\s+/);
  const phoneDigits = customer.telefone.replace(/\D/g, "");

  const preferenceItems = items.map((item) => ({
    id: String(item.variacao_id || item.produto_id),
    title: item.nome.slice(0, 120),
    picture_url: item.imagem_url || undefined,
    quantity: item.quantidade,
    currency_id: "BRL",
    unit_price: Number(item.preco_unitario),
  }));

  // O Mercado Pago estava criando o pagamento somente com o valor dos produtos.
  // Para garantir que o frete faça parte do transaction_amount, cobramos o frete
  // como um item explícito da preferência. Não enviamos shipments.cost para evitar
  // qualquer risco de cobrança duplicada.
  const shippingAmount = roundMoney(order.frete);
  if (shippingAmount > 0) {
    preferenceItems.push({
      id: `frete-${order.id}`,
      title: `Frete — ${order.frete_transportadora || order.frete_servico_nome || "Entrega"}`.slice(0, 120),
      quantity: 1,
      currency_id: "BRL",
      unit_price: shippingAmount,
    });
  }

  const preferenceTotal = roundMoney(
    preferenceItems.reduce(
      (sum, item) => sum + Number(item.unit_price) * Number(item.quantity),
      0
    )
  );
  const orderTotal = roundMoney(order.total);

  if (Math.abs(preferenceTotal - orderTotal) >= 0.01) {
    console.error("[MercadoPago preference] total divergente antes de criar pagamento", {
      pedidoId: order.id,
      preferenceTotal,
      orderTotal,
      subtotal: Number(order.subtotal),
      frete: Number(order.frete),
    });
    throw new Error("O total enviado ao Mercado Pago não corresponde ao total do pedido.");
  }

  return preference.create({
    body: {
      items: preferenceItems,
      external_reference: order.id,
      metadata: { pedido_id: order.id, pedido_numero: order.numero },
      payer: {
        name: nameParts[0] || customer.nome,
        surname: nameParts.slice(1).join(" ") || undefined,
        email: customer.email,
        phone: phoneDigits ? { number: phoneDigits } : undefined,
        address: {
          zip_code: customer.cep,
          street_name: customer.rua,
          street_number: customer.numero,
        },
      },
      shipments: {
        mode: "not_specified",
        free_shipping: shippingAmount === 0,
        receiver_address: {
          zip_code: customer.cep,
          street_name: customer.rua,
          street_number: customer.numero,
          apartment: customer.complemento || undefined,
          city_name: customer.cidade,
          state_name: customer.estado,
          country_name: "Brasil",
        },
      },
      back_urls: {
        success: `${siteUrl}/pagamento/sucesso?pedido=${order.id}`,
        pending: `${siteUrl}/pagamento/pendente?pedido=${order.id}`,
        failure: `${siteUrl}/pagamento/falha?pedido=${order.id}`,
      },
      notification_url: `${siteUrl}/api/mercadopago/webhook`,
      auto_return: "approved",
      statement_descriptor: "VIRELLA",
      payment_methods: { installments: 12 },
    },
    requestOptions: { idempotencyKey: order.id },
  });
}

export async function getMercadoPagoPayment(paymentId) {
  const payment = new Payment(getClient());
  return payment.get({ id: paymentId });
}
