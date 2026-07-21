import { NextResponse } from "next/server";
import { calculateCheckout, validateCustomer } from "@/lib/checkout";
import { createPaymentPreference } from "@/lib/mercadopago";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  createOrder,
  markOrderError,
  savePreference,
} from "@/modules/orders/order.service";

function siteUrl(request) {
  return String(
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    request.nextUrl.origin
  ).replace(/\/$/, "");
}

async function requiredUser(request) {
  const authorization = request.headers.get("authorization") || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!token) throw new Error("Entre na sua conta para finalizar a compra.");

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) throw new Error("Sua sessão expirou. Entre novamente para continuar.");
  return data.user;
}

export async function POST(request) {
  let order = null;

  try {
    const body = await request.json();
    const [checkout, user] = await Promise.all([
      calculateCheckout(body?.items),
      requiredUser(request),
    ]);
    const customer = validateCustomer(body?.customer);

    order = await createOrder({ userId: user.id, customer, checkout });
    const preference = await createPaymentPreference({
      order,
      items: checkout.items,
      customer,
      siteUrl: siteUrl(request),
    });

    if (!preference?.id || !preference?.init_point) {
      throw new Error("O Mercado Pago não retornou o link de pagamento.");
    }

    await savePreference(order.id, preference.id);

    return NextResponse.json({
      order_id: order.id,
      order_number: order.numero,
      checkout_url: preference.init_point,
    });
  } catch (error) {
    if (order?.id) await markOrderError(order.id);
    console.error("Erro ao iniciar pagamento:", error);

    const knownMessage = error?.message?.includes("Mercado Pago ainda não")
      ? error.message
      : error?.message || "Não foi possível iniciar o pagamento.";

    const isAuthError = knownMessage.includes("Entre na sua conta") || knownMessage.includes("sessão expirou");
    return NextResponse.json({ error: knownMessage }, { status: isAuthError ? 401 : 400 });
  }
}
