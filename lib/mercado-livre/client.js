import "server-only";
import { getMercadoLivreConfig } from "./config";
import {
  getMercadoLivreAccount,
  saveMercadoLivreAccount,
} from "./token-store";

async function parseResponse(response) {
  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  if (!response.ok) {
    const message =
      body?.message ||
      body?.error ||
      body?.cause?.map?.((item) => item?.message).filter(Boolean).join("; ") ||
      `Mercado Livre respondeu HTTP ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.details = body;
    throw error;
  }

  return body;
}

async function refreshAccessToken(account) {
  const config = getMercadoLivreConfig();
  if (!account?.refresh_token) {
    throw new Error("A autorização atual não possui refresh_token. Reconecte a conta do Mercado Livre para renovar o acesso.");
  }

  const form = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: config.clientId,
    client_secret: config.clientSecret,
    refresh_token: account.refresh_token,
  });

  const response = await fetch(`${config.apiBase}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form,
    cache: "no-store",
  });
  const token = await parseResponse(response);

  return saveMercadoLivreAccount({
    seller_id: token.user_id || account.seller_id,
    nickname: account.nickname,
    access_token: token.access_token,
    refresh_token: token.refresh_token || account.refresh_token,
    token_expires_at: new Date(Date.now() + Number(token.expires_in || 21600) * 1000).toISOString(),
    scope: token.scope || account.scope,
  });
}

export async function getValidMercadoLivreAccount() {
  const account = await getMercadoLivreAccount();
  if (!account) throw new Error("Conecte sua conta do Mercado Livre primeiro.");

  const expiresAt = new Date(account.token_expires_at || 0).getTime();
  if (!expiresAt || expiresAt - Date.now() < 90_000) {
    if (!account.refresh_token) {
      throw new Error("A autorização do Mercado Livre expirou e não possui refresh_token. Clique em Conectar Mercado Livre para autorizar novamente.");
    }
    return refreshAccessToken(account);
  }
  return account;
}

export async function mercadoLivreFetch(path, options = {}, retry = true) {
  const config = getMercadoLivreConfig();
  let account = await getValidMercadoLivreAccount();

  const doRequest = (token) =>
    fetch(`${config.apiBase}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

  let response = await doRequest(account.access_token);
  if (response.status === 401 && retry) {
    if (!account.refresh_token) {
      throw new Error("O Mercado Livre expirou a autorização atual. Reconecte a conta para continuar.");
    }
    account = await refreshAccessToken(account);
    response = await doRequest(account.access_token);
  }

  return parseResponse(response);
}

export async function getMercadoLivreSellerProfile() {
  const account = await getValidMercadoLivreAccount();
  return mercadoLivreFetch(`/users/${encodeURIComponent(account.seller_id)}`);
}

export async function searchMercadoLivreCategoryCandidates(query, limit = 8) {
  const q = encodeURIComponent(String(query || "").trim());
  if (!q) return [];
  const safeLimit = Math.max(1, Math.min(Number(limit) || 8, 20));
  const results = await mercadoLivreFetch(`/sites/MLB/domain_discovery/search?q=${q}&limit=${safeLimit}`);
  if (!Array.isArray(results)) return [];

  const seen = new Set();
  return results
    .filter((item) => item?.category_id)
    .filter((item) => {
      if (seen.has(item.category_id)) return false;
      seen.add(item.category_id);
      return true;
    })
    .map((item) => ({
      category_id: item.category_id,
      category_name: item.category_name || item.category_id,
      domain_id: item.domain_id || null,
      domain_name: item.domain_name || null,
    }));
}

export async function predictMercadoLivreCategory(query) {
  const results = await searchMercadoLivreCategoryCandidates(query, 1);
  return results[0] || null;
}

export async function getMercadoLivreTopCategories() {
  const result = await mercadoLivreFetch(`/sites/MLB/categories`);
  return Array.isArray(result)
    ? result.map((item) => ({ id: item.id, name: item.name }))
    : [];
}

export async function getMercadoLivreCategory(categoryId) {
  if (!categoryId) throw new Error("Categoria inválida.");
  return mercadoLivreFetch(`/categories/${encodeURIComponent(categoryId)}`);
}

export async function getMercadoLivreCategoryAttributes(categoryId) {
  if (!categoryId) return [];
  const result = await mercadoLivreFetch(`/categories/${encodeURIComponent(categoryId)}/attributes`);
  return Array.isArray(result) ? result : [];
}
