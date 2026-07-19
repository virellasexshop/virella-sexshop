import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE_NAME = "virella_admin_session";

function sessionToken() {
  const password = process.env.ADMIN_PASSWORD;
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!password || !secret) return null;

  return createHmac("sha256", secret)
    .update(`virella-admin:${password}`)
    .digest("hex");
}

export function safeCompare(first, second) {
  const firstBuffer = Buffer.from(String(first || ""));
  const secondBuffer = Buffer.from(String(second || ""));
  if (firstBuffer.length !== secondBuffer.length) return false;
  return timingSafeEqual(firstBuffer, secondBuffer);
}

export function adminIsConfigured() {
  return Boolean(process.env.ADMIN_PASSWORD && process.env.ADMIN_SESSION_SECRET);
}

export async function hasAdminAccess() {
  const expected = sessionToken();
  if (!expected) return false;
  const cookieStore = await cookies();
  return safeCompare(cookieStore.get(COOKIE_NAME)?.value, expected);
}

export async function requireAdmin() {
  if (!(await hasAdminAccess())) redirect("/acesso-admin");
}

export async function createAdminSession() {
  const token = sessionToken();
  if (!token) throw new Error("Acesso administrativo ainda não configurado.");

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
