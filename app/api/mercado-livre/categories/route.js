import { requireAdminApi, jsonError } from "@/lib/mercado-livre/api-auth";
import { searchMercadoLivreCategoryCandidates } from "@/lib/mercado-livre/client";

export async function GET(request) {
  try {
    await requireAdminApi();
    const q = new URL(request.url).searchParams.get("q") || "";
    if (!q.trim()) {
      return Response.json({ ok: false, error: "Informe um termo para buscar categorias." }, { status: 400 });
    }

    const candidates = await searchMercadoLivreCategoryCandidates(q, 8);
    return Response.json({
      ok: true,
      candidates,
      // Mantém compatibilidade com versões anteriores do painel.
      category: candidates[0] || null,
    });
  } catch (error) {
    return jsonError(error);
  }
}
