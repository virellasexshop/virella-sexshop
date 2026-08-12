import { NextResponse } from "next/server";
import {
  InvalidWebhookSignatureError,
  WebhookSignatureValidator,
} from "mercadopago";
import { getMercadoPagoPayment } from "@/lib/mercadopago";
import { updateOrderFromPayment } from "@/modules/orders/order.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getNotificationData(request, body) {
  const queryId = request.nextUrl.searchParams.get("data.id");
  const bodyId = body?.data?.id;
  const dataId = String(queryId || bodyId || "").trim();
  const eventType = String(
    request.nextUrl.searchParams.get("type") || body?.type || ""
  ).trim();
  return { dataId, eventType, queryId };
}

export async function POST(request) {
  let dataId = "";
  try {
    const body = await request.json().catch(() => ({}));
    const notification = getNotificationData(request, body);
    dataId = notification.dataId;

    // Ignora notificações que não são de pagamento, mas confirma o recebimento.
    if (!dataId || (notification.eventType && notification.eventType !== "payment")) {
      return NextResponse.json({ received: true });
    }

    const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
    if (!secret && process.env.NODE_ENV === "production") {
      console.error("[MercadoPago webhook] MERCADO_PAGO_WEBHOOK_SECRET não configurado.");
      return NextResponse.json({ error: "Webhook não configurado." }, { status: 503 });
    }

    // O Mercado Pago normalmente envia data.id também na query string. Para
    // notificações legítimas com assinatura, validamos usando o ID recebido.
    if (secret) {
      WebhookSignatureValidator.validate({
        xSignature: request.headers.get("x-signature") || "",
        xRequestId: request.headers.get("x-request-id") || "",
        dataId,
        secret,
      });
    }

    const payment = await getMercadoPagoPayment(dataId);
    const updatedOrder = await updateOrderFromPayment(payment);

    console.info("[MercadoPago webhook] pagamento processado", {
      paymentId: String(payment?.id || dataId),
      paymentStatus: payment?.status || null,
      orderId: updatedOrder?.id || payment?.external_reference || payment?.metadata?.pedido_id || null,
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    if (error instanceof InvalidWebhookSignatureError) {
      console.warn("[MercadoPago webhook] assinatura inválida", { dataId });
      return NextResponse.json({ error: "Assinatura inválida." }, { status: 401 });
    }

    console.error("[MercadoPago webhook] erro ao processar", {
      dataId,
      name: error?.name,
      message: error?.message,
      cause: error?.cause,
    });
    return NextResponse.json(
      { error: "Erro ao processar notificação." },
      { status: 500 }
    );
  }
}
