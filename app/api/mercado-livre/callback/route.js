import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getMercadoLivreConfig } from "@/lib/mercado-livre/config";
import { saveMercadoLivreAccount } from "@/lib/mercado-livre/token-store";

export async function GET(request) {
  const config = getMercadoLivreConfig();
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error") || url.searchParams.get("error_description");
  const cookieStore = await cookies();
  const expectedState = cookieStore.get("virella_ml_oauth_state")?.value;
  const verifier = cookieStore.get("virella_ml_pkce")?.value;

  cookieStore.delete("virella_ml_oauth_state");
  cookieStore.delete("virella_ml_pkce");

  if (oauthError) {
    return NextResponse.redirect(`${config.siteUrl}/admin/mercado-livre?erro=${encodeURIComponent(oauthError)}`);
  }
  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(`${config.siteUrl}/admin/mercado-livre?erro=${encodeURIComponent("Autorização inválida ou expirada.")}`);
  }

  try {
    const form = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      redirect_uri: config.redirectUri,
    });
    if (config.usePkce && verifier) form.set("code_verifier", verifier);

    const response = await fetch(`${config.apiBase}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form,
      cache: "no-store",
    });
    const token = await response.json();
    if (!response.ok || !token?.access_token || !token?.user_id) {
      throw new Error(token?.message || token?.error || "Não foi possível obter o token do Mercado Livre.");
    }

    let nickname = null;
    try {
      const profileResponse = await fetch(`${config.apiBase}/users/${token.user_id}`, {
        headers: { Authorization: `Bearer ${token.access_token}` },
        cache: "no-store",
      });
      if (profileResponse.ok) {
        const profile = await profileResponse.json();
        nickname = profile?.nickname || null;
      }
    } catch {}

    await saveMercadoLivreAccount({
      seller_id: token.user_id,
      nickname,
      access_token: token.access_token,
      refresh_token: token.refresh_token,
      token_expires_at: new Date(Date.now() + Number(token.expires_in || 21600) * 1000).toISOString(),
      scope: token.scope || null,
    });

    return NextResponse.redirect(`${config.siteUrl}/admin/mercado-livre?conectado=1`);
  } catch (error) {
    return NextResponse.redirect(`${config.siteUrl}/admin/mercado-livre?erro=${encodeURIComponent(error.message)}`);
  }
}
