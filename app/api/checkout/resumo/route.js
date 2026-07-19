import { NextResponse } from "next/server";
import { calculateCheckout } from "@/lib/checkout";

export async function POST(request) {
  try {
    const body = await request.json();
    const checkout = await calculateCheckout(body?.items);
    return NextResponse.json(checkout);
  } catch (error) {
    return NextResponse.json(
      { error: error?.message || "Não foi possível calcular o pedido." },
      { status: 400 }
    );
  }
}
