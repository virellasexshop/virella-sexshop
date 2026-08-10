import "server-only";
import { hasAdminAccess } from "@/lib/admin-auth";

export async function requireAdminApi() {
  if (!(await hasAdminAccess())) {
    const error = new Error("Acesso administrativo necessário.");
    error.status = 401;
    throw error;
  }
}

export function jsonError(error, fallbackStatus = 500) {
  const status = Number(error?.status) || fallbackStatus;
  return Response.json(
    {
      ok: false,
      error: error?.message || "Erro inesperado.",
      details: error?.details || null,
    },
    { status }
  );
}
