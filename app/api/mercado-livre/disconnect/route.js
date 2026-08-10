import { requireAdminApi, jsonError } from "@/lib/mercado-livre/api-auth";
import { clearMercadoLivreAccounts } from "@/lib/mercado-livre/token-store";

export async function POST() {
  try {
    await requireAdminApi();
    await clearMercadoLivreAccounts();
    return Response.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
