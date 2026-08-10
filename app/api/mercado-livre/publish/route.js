import { requireAdminApi, jsonError } from "@/lib/mercado-livre/api-auth";
import { publishProductToMercadoLivre } from "@/lib/mercado-livre/products";

export async function POST(request) {
  try {
    await requireAdminApi();
    const body = await request.json();
    if (!body?.product_id) return Response.json({ ok: false, error: "Produto inválido." }, { status: 400 });
    const item = await publishProductToMercadoLivre(body.product_id, body);
    return Response.json({ ok: true, item });
  } catch (error) {
    return jsonError(error, 400);
  }
}
