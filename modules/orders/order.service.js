import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function createOrder({ userId, customer, checkout }) {
  const supabase = createSupabaseAdminClient();
  const { data: order, error: orderError } = await supabase
    .from("pedidos")
    .insert({
      usuario_id: userId || null,
      cliente_nome: customer.nome,
      cliente_email: customer.email,
      cliente_telefone: customer.telefone || null,
      endereco_cep: customer.cep,
      endereco_rua: customer.rua,
      endereco_numero: customer.numero,
      endereco_complemento: customer.complemento || null,
      endereco_bairro: customer.bairro,
      endereco_cidade: customer.cidade,
      endereco_estado: customer.estado,
      subtotal: checkout.subtotal,
      frete: checkout.frete,
      total: checkout.total,
    })
    .select()
    .single();

  if (orderError) throw orderError;

  const { error: itemsError } = await supabase.from("pedido_itens").insert(
    checkout.items.map((item) => ({ ...item, pedido_id: order.id }))
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
    const { error } = await supabase.rpc("confirmar_pagamento_virella", {
      p_pedido_id: order.id,
      p_pagamento_id: String(payment.id),
      p_pago_em: payment.date_approved || new Date().toISOString(),
    });
    if (error) throw error;
    return { ...order, status_pagamento: status };
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
    .select("id,numero,status_pedido,status_pagamento,total,criado_em,pago_em,pedido_itens(nome,quantidade,preco_unitario,imagem_url)")
    .eq("usuario_id", userId)
    .order("criado_em", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getAdminOrders() {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("pedidos")
    .select("*,pedido_itens(nome,quantidade)")
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
