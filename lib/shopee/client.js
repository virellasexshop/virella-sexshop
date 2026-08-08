import "server-only";
import { createHmac } from "node:crypto";

const BASE_URL = process.env.SHOPEE_API_BASE_URL || "https://partner.shopeemobile.com";

function config() {
  const partnerId = Number(process.env.SHOPEE_PARTNER_ID);
  const partnerKey = process.env.SHOPEE_PARTNER_KEY;
  if (!Number.isInteger(partnerId) || !partnerKey) {
    throw new Error("Configure SHOPEE_PARTNER_ID e SHOPEE_PARTNER_KEY na Vercel.");
  }
  return { partnerId, partnerKey };
}

function sign(baseString, partnerKey) {
  return createHmac("sha256", partnerKey).update(baseString).digest("hex");
}

export function shopeeAuthUrl(redirectUrl) {
  const { partnerId, partnerKey } = config();
  const path = "/api/v2/shop/auth_partner";
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = sign(`${partnerId}${path}${timestamp}`, partnerKey);
  const url = new URL(`${BASE_URL}${path}`);
  url.searchParams.set("partner_id", String(partnerId));
  url.searchParams.set("timestamp", String(timestamp));
  url.searchParams.set("sign", signature);
  url.searchParams.set("redirect", redirectUrl);
  return url.toString();
}

export async function shopeeTokenRequest(path, body) {
  const { partnerId, partnerKey } = config();
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = sign(`${partnerId}${path}${timestamp}`, partnerKey);
  const url = new URL(`${BASE_URL}${path}`);
  url.searchParams.set("partner_id", String(partnerId));
  url.searchParams.set("timestamp", String(timestamp));
  url.searchParams.set("sign", signature);

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, partner_id: partnerId }),
    cache: "no-store",
  });
  const result = await response.json().catch(() => null);
  if (!response.ok || result?.error) {
    throw new Error(result?.message || result?.error || `Erro Shopee (${response.status}).`);
  }
  return result;
}

export async function shopeeRequest({ path, accessToken, shopId, method = "GET", body, query }) {
  const { partnerId, partnerKey } = config();
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = sign(`${partnerId}${path}${timestamp}${accessToken}${shopId}`, partnerKey);
  const url = new URL(`${BASE_URL}${path}`);
  url.searchParams.set("partner_id", String(partnerId));
  url.searchParams.set("timestamp", String(timestamp));
  url.searchParams.set("access_token", accessToken);
  url.searchParams.set("shop_id", String(shopId));
  url.searchParams.set("sign", signature);
  Object.entries(query || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
  });

  const response = await fetch(url, {
    method,
    headers: body instanceof FormData ? undefined : { "Content-Type": "application/json" },
    body: body == null ? undefined : body instanceof FormData ? body : JSON.stringify(body),
    cache: "no-store",
  });
  const result = await response.json().catch(() => null);
  if (!response.ok || result?.error) {
    throw new Error(result?.message || result?.error || `Erro Shopee (${response.status}).`);
  }
  return result;
}
