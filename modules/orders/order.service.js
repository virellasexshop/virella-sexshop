import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  checkoutShippingLabel,
  createShippingLabelCart,
  generateShippingLabel,
  printShippingLabel,
} from "@/lib/melhor-envio";

export async function createOrder({ userId, customer, checkout }) {
  const supabase = createSupabaseAdminClient();
  const { data: order, error: orderError } = await supabase
    .from("pedidos")
    .insert({
      usuario_id: userId || null,
      cliente_nome: customer.nome,
      cliente_email: customer.email,
      cliente_telefone: customer.telefone || null,
      cliente_documento: customer.documento,
      endereco_cep: customer.cep,
      endereco_rua: customer.rua,
      endereco_numero: customer.numero,
      endereco_complemento: customer.complemento || null,
      endereco_bairro: customer.bairro,
      endereco_cidade: customer.cidade,
      endereco_estado: customer.estado,
      subtotal: checkout.subtotal,
      frete: checkout.frete,
      frete_servico_id: checkout.frete_selecionado.id,
      frete_servico_nome: checkout.frete_selecionado.servico,
      frete_transportadora: checkout.frete_selecionado.transportadora,
      frete_prazo_dias: checkout.frete_selecionado.prazo_dias,
      frete_preco_original: checkout.frete_selecionado.preco_original,
      frete_gratis: checkout.frete_selecionado.gratuito,
      frete_pacotes: checkout.frete_selecionado.pacotes || [],
      total: checkout.total,
    })
    .select()
    .single();

  if (orderError) throw orderError;

  const { error: itemsError } = await supabase.from("pedido_itens").insert(
    checkout.items.map((item) => ({
      pedido_id: order.id,
      produto_id: item.produto_id,
      variacao_id: item.variacao_id,
      variacao_nome: item.variacao_nome,
      nome: item.nome,
      imagem_url: item.imagem_url,
      quantidade: item.quantidade,
      preco_unitario: item.preco_unitario,
      total: item.total,
    }))
  );

  if (itemsError) {
    await supabase.from("pedidos").delete().eq("id", order.id);
    throw itemsError;
  }

  return order;
}

export async function savePreference(orderId, preferenceId) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("pedidos")
    .update({ mercado_pago_preferencia_id: preferenceId, atualizado_em: new Date().toISOString() })
    .eq("id", orderId);
  if (error) throw error;
}

export async function markOrderError(orderId) {
  const supabase = createSupabaseAdminClient();
  await supabase
    .from("pedidos")
    .update({ status_pagamento: "erro", atualizado_em: new Date().toISOString() })
    .eq("id", orderId);
}

export async function getOrderById(orderId) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("pedidos").select("*").eq("id", orderId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateOrderFromPayment(payment) {
  const orderId = String(payment.external_reference || payment.metadata?.pedido_id || "");
  if (!orderId) return null;

  const order = await getOrderById(orderId);
  if (!order) return null;

  const amountMatches = Math.abs(Number(payment.transaction_amount) - Number(order.total)) < 0.01;
  const currencyMatches = !payment.currency_id || payment.currency_id === "BRL";
  if (!amountMatches || !currencyMatches) throw new Error("Pagamento não corresponde ao total do pedido.");

  const statusMap = {
    approved: "aprovado",
    pending: "aguardando",
    in_process: "em_analise",
    authorized: "em_analise",
    rejected: "recusado",
    cancelled: "cancelado",
    refunded: "estornado",
    charged_back: "estornado",
  };
  const status = statusMap[payment.status] || "aguardando";
  const supabase = createSupabaseAdminClient();

  if (status === "aprovado") {
    // A loja trabalha com estoque infinito. Portanto, a confirmação do pagamento
    // não precisa chamar uma RPC que baixa estoque. A atualização direta é
    // idempotente e evita que uma função SQL antiga/quebrada derrube o webhook.
    const { error } = await supabase
      .from("pedidos")
      .update({
        status_pagamento: "aprovado",
        mercado_pago_pagamento_id: String(payment.id),
        pago_em: payment.date_approved || order.pago_em || new Date().toISOString(),
        atualizado_em: new Date().toISOString(),
      })
      .eq("id", order.id);
    if (error) throw error;
    return { ...order, status_pagamento: "aprovado" };
  }

  const { error } = await supabase
    .from("pedidos")
    .update({
      status_pagamento: status,
      mercado_pago_pagamento_id: String(payment.id),
      pago_em: order.pago_em,
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", order.id);
  if (error) throw error;
  return { ...order, status_pagamento: status };
}

export async function getCustomerOrders(userId) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("pedidos")
    .select("id,numero,status_pedido,status_pagamento,total,frete,frete_servico_nome,frete_transportadora,frete_prazo_dias,frete_gratis,criado_em,pago_em,pedido_itens(nome,quantidade,preco_unitario,imagem_url)")
    .eq("usuario_id", userId)
    .order("criado_em", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getAdminOrders() {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("pedidos")
    .select("*,pedido_itens(produto_id,nome,variacao_nome,quantidade,preco_unitario,total,imagem_url)")
    .order("criado_em", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function countOrders() {
  const supabase = createSupabaseAdminClient();
  const { count, error } = await supabase.from("pedidos").select("id", { count: "exact", head: true });
  if (error) return 0;
  return count || 0;
}

export async function updateOrderStatus(orderId, status) {
  const allowed = new Set(["novo", "em_separacao", "enviado", "entregue", "cancelado"]);
  if (!allowed.has(status)) throw new Error("Status inválido.");
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("pedidos")
    .update({ status_pedido: status, atualizado_em: new Date().toISOString() })
    .eq("id", orderId);
  if (error) throw error;
}


export async function issueShippingLabel(orderId, invoiceKey = "") {
  const supabase = createSupabaseAdminClient();
  const { data: order, error: orderError } = await supabase
    .from("pedidos")
    .select("*,pedido_itens(produto_id,nome,variacao_nome,quantidade,preco_unitario,total,imagem_url)")
    .eq("id", orderId)
    .maybeSingle();
  if (orderError) throw orderError;
  if (!order) throw new Error("Pedido não encontrado.");
  if (order.frete_etiqueta_url) {
    return { shipmentId: order.frete_etiqueta_id, printUrl: order.frete_etiqueta_url };
  }

  const updateLabel = async (values) => {
    const { error } = await supabase
      .from("pedidos")
      .update({ ...values, atualizado_em: new Date().toISOString() })
      .eq("id", order.id);
    if (error) throw error;
  };

  try {
    let shipmentId = order.frete_etiqueta_id;
    let stage = order.frete_etiqueta_status;

    if (!shipmentId) {
      const productIds = [...new Set((order.pedido_itens || []).map((item) => item.produto_id).filter(Boolean))];
      let logisticsByProduct = new Map();
      if (productIds.length) {
        const { data: products, error: productError } = await supabase
          .from("produtos")
          .select("id,peso_kg,altura_cm,largura_cm,comprimento_cm")
          .in("id", productIds);
        if (productError) throw productError;
        logisticsByProduct = new Map((products || []).map((product) => [String(product.id), product]));
      }
      const items = (order.pedido_itens || []).map((item) => ({
        ...item,
        logistica: logisticsByProduct.get(String(item.produto_id)) || null,
      }));
      const cart = await createShippingLabelCart({ order, items, invoiceKey });
      shipmentId = cart.shipmentId;
      stage = "carrinho";
      await updateLabel({
        frete_etiqueta_id: shipmentId,
        frete_etiqueta_status: stage,
        frete_nota_fiscal_chave: cart.invoiceKey,
        frete_etiqueta_erro: null,
      });
    }

    if (stage === "carrinho" || !stage || stage === "erro") {
      await checkoutShippingLabel(shipmentId);
      stage = "comprada";
      await updateLabel({ frete_etiqueta_status: stage, frete_etiqueta_erro: null });
    }

    if (stage === "comprada") {
      await generateShippingLabel(shipmentId);
      stage = "gerada";
      await updateLabel({
        frete_etiqueta_status: stage,
        frete_etiqueta_gerada_em: new Date().toISOString(),
        frete_etiqueta_erro: null,
      });
    }

    const printUrl = await printShippingLabel(shipmentId);
    await updateLabel({
      frete_etiqueta_url: printUrl,
      frete_etiqueta_status: "pronta",
      frete_etiqueta_erro: null,
      status_pedido: order.status_pedido === "novo" ? "em_separacao" : order.status_pedido,
    });
    return { shipmentId, printUrl };
  } catch (error) {
    await supabase
      .from("pedidos")
      .update({
        frete_etiqueta_erro: String(error?.message || "Erro ao emitir etiqueta").slice(0, 500),
        atualizado_em: new Date().toISOString(),
      })
      .eq("id", order.id);
    throw error;
  }
}

