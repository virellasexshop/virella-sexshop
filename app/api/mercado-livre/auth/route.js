import { randomBytes, createHash } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { hasAdminAccess } from "@/lib/admin-auth";
import { getMercadoLivreConfig } from "@/lib/mercado-livre/config";

function base64url(buffer) {
  return buffer.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function GET(request) {
  const config = getMercadoLivreConfig();
  const currentUrl = new URL(request.url);
  const canonical = new URL(config.siteUrl);

  // Se o painel foi aberto pelo domínio da Vercel, primeiro migra o navegador
  // para o domínio oficial. Um servidor em *.vercel.app não pode criar cookie
  // para .virellasexshop.com.br, então o state do OAuth se perdia no callback.
  if (process.env.NODE_ENV === "production" && currentUrl.hostname !== canonical.hostname) {
    return NextResponse.redirect(new URL("/api/mercado-livre/auth", config.siteUrl));
  }

  if (!(await hasAdminAccess())) {
    return NextResponse.redirect(new URL("/acesso-admin", config.siteUrl));
  }

  const state = base64url(randomBytes(24));
  const verifier = base64url(randomBytes(48));
  const params = new URLSearchParams({
    response_type: "code",
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    state,
  });

  if (config.usePkce) {
    const challenge = base64url(createHash("sha256").update(verifier).digest());
    params.set("code_challenge", challenge);
    params.set("code_challenge_method", "S256");
  }

  const cookieStore = await cookies();
  const cookieOptions = {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 10 * 60,
    ...(process.env.NODE_ENV === "production" ? { domain: ".virellasexshop.com.br" } : {}),
  };

  cookieStore.set("virella_ml_oauth_state", state, cookieOptions);
  if (config.usePkce) cookieStore.set("virella_ml_pkce", verifier, cookieOptions);

  return NextResponse.redirect(`${config.authBase}?${params.toString()}`);
}
