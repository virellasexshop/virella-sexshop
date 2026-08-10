import "server-only";

export function getMercadoLivreConfig() {
  const clientId = process.env.MERCADO_LIVRE_CLIENT_ID || process.env.ML_CLIENT_ID;
  const clientSecret = process.env.MERCADO_LIVRE_CLIENT_SECRET || process.env.ML_CLIENT_SECRET;

  // URL canônica usada pelo OAuth em produção. Mantemos uma variável própria
  // para evitar que um NEXT_PUBLIC_SITE_URL antigo da Vercel envie o callback
  // para o domínio *.vercel.app.
  const siteUrl = String(
    process.env.MERCADO_LIVRE_SITE_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.SITE_URL ||
      "https://www.virellasexshop.com.br"
  ).replace(/\/$/, "");

  const redirectUri =
    process.env.MERCADO_LIVRE_REDIRECT_URI || `${siteUrl}/api/mercado-livre/callback`;
  const usePkce = String(process.env.MERCADO_LIVRE_USE_PKCE || "false").toLowerCase() === "true";

  if (!clientId || !clientSecret) {
    throw new Error("Configure MERCADO_LIVRE_CLIENT_ID e MERCADO_LIVRE_CLIENT_SECRET na Vercel.");
  }

  return {
    clientId,
    clientSecret,
    siteUrl,
    redirectUri,
    usePkce,
    siteId: "MLB",
    apiBase: "https://api.mercadolibre.com",
    authBase: "https://auth.mercadolivre.com.br/authorization",
  };
}
