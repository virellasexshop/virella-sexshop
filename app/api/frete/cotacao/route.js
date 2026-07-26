import { NextResponse } from "next/server";
import { calculateCheckout } from "@/lib/checkout";
import { quoteShipping } from "@/lib/melhor-envio";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

async function requireUser(request) {
  const authorization = request.headers.get("authorization") || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!token) throw new Error("Entre na sua conta para calcular o frete.");

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) throw new Error("Sua sessão expirou. Entre novamente.");
}

export async function POST(request) {
  try {
    const body = await request.json();
    await requireUser(request);
    const checkout = await calculateCheckout(body?.items);
    const shipping = await quoteShipping({
      items: checkout.items,
      subtotal: checkout.subtotal,
      destinationPostalCode: body?.cep,
    });

    return NextResponse.json({
      subtotal: checkout.subtotal,
      ...shipping,
    });
  } catch (error) {
    const message = error?.message || "Não foi possível calcular o frete.";
    const authError = message.includes("Entre na sua conta") || message.includes("sessão expirou");
    return NextResponse.json({ error: message }, { status: authError ? 401 : 400 });
  }
}
