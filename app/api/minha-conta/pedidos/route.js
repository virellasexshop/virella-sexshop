import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCustomerOrders } from "@/modules/orders/order.service";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const authorization = request.headers.get("authorization") || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!token) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return NextResponse.json({ error: "Sessão inválida." }, { status: 401 });
  }

  try {
    return NextResponse.json({ orders: await getCustomerOrders(data.user.id) });
  } catch (orderError) {
    console.error("Erro ao carregar pedidos do cliente:", orderError);
    return NextResponse.json({ error: "Não foi possível carregar os pedidos." }, { status: 500 });
  }
}
