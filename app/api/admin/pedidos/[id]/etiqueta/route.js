import { NextResponse } from "next/server";
import { hasAdminAccess } from "@/lib/admin-auth";
import { issueShippingLabel } from "@/modules/orders/order.service";

export async function POST(request, { params }) {
  if (!(await hasAdminAccess())) {
    return NextResponse.json({ error: "Acesso administrativo necessário." }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const result = await issueShippingLabel(String(id || ""), String(body?.invoice_key || ""));
    return NextResponse.json({
      success: true,
      shipment_id: result.shipmentId,
      print_url: result.printUrl,
    });
  } catch (error) {
    console.error("Erro ao emitir etiqueta:", error);
    return NextResponse.json(
      { error: error?.message || "Não foi possível emitir a etiqueta." },
      { status: 400 }
    );
  }
}
