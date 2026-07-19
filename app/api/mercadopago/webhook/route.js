import { NextResponse } from "next/server";
import {
  InvalidWebhookSignatureError,
  WebhookSignatureValidator,
} from "mercadopago";
import { getMercadoPagoPayment } from "@/lib/mercadopago";
import { updateOrderFromPayment } from "@/modules/orders/order.service";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const dataId = String(
      request.nextUrl.searchParams.get("data.id") || body?.data?.id || ""
    );
    const eventType = request.nextUrl.searchParams.get("type") || body?.type;

    if (!dataId || (eventType && eventType !== "payment")) {
      return NextResponse.json({ received: true });
    }

    const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
    if (!secret && process.env.NODE_ENV === "production") {
      console.error("MERCADO_PAGO_WEBHOOK_SECRET não configurado.");
      return NextResponse.json({ error: "Webhook não configurado." }, { status: 503 });
    }

    if (secret) {
      WebhookSignatureValidator.validate({
        xSignature: request.headers.get("x-signature") || "",
        xRequestId: request.headers.get("x-request-id") || "",
        dataId,
        secret,
      });
    }

    const payment = await getMercadoPagoPayment(dataId);
    await updateOrderFromPayment(payment);
    return NextResponse.json({ received: true });
  } catch (error) {
    if (error instanceof InvalidWebhookSignatureError) {
      return NextResponse.json({ error: "Assinatura inválida." }, { status: 401 });
    }
    console.error("Erro no webhook Mercado Pago:", error);
    return NextResponse.json({ error: "Erro ao processar notificação." }, { status: 500 });
  }
}
