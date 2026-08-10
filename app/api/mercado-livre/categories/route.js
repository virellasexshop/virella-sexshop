import { requireAdminApi, jsonError } from "@/lib/mercado-livre/api-auth";
import { predictMercadoLivreCategory } from "@/lib/mercado-livre/client";

export async function GET(request) {
  try {
    await requireAdminApi();
    const q = new URL(request.url).searchParams.get("q") || "";
    const result = await predictMercadoLivreCategory(q);
    return Response.json({ ok: true, category: result });
  } catch (error) {
    return jsonError(error);
  }
}
