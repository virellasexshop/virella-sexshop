import "server-only";

import { MercadoPagoConfig, Payment, Preference } from "mercadopago";

function getClient() {
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!accessToken) throw new Error("Mercado Pago ainda não foi configurado.");
  return new MercadoPagoConfig({ accessToken, options: { timeout: 10000 } });
}

export async function createPaymentPreference({ order, items, customer, siteUrl }) {
  const preference = new Preference(getClient());
  const nameParts = customer.nome.split(/\s+/);
  const phoneDigits = customer.telefone.replace(/\D/g, "");

  return preference.create({
    body: {
      items: items.map((item) => ({
        id: String(item.variacao_id || item.produto_id),
        title: item.nome.slice(0, 120),
        picture_url: item.imagem_url || undefined,
        quantity: item.quantidade,
        currency_id: "BRL",
        unit_price: Number(item.preco_unitario),
      })),
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
        cost: Number(order.frete),
        free_shipping: Number(order.frete) === 0,
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
