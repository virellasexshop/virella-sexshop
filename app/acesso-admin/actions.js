"use server";

import { redirect } from "next/navigation";
import {
  adminIsConfigured,
  clearAdminSession,
  createAdminSession,
  safeCompare,
} from "@/lib/admin-auth";

export async function loginAdminAction(_previousState, formData) {
  if (!adminIsConfigured()) {
    return {
      error: "Configure ADMIN_PASSWORD e ADMIN_SESSION_SECRET na Vercel antes de entrar.",
    };
  }

  const password = String(formData.get("senha") || "");
  if (!safeCompare(password, process.env.ADMIN_PASSWORD)) {
    return { error: "Senha administrativa incorreta." };
  }

  await createAdminSession();
  redirect("/admin");
}

export async function logoutAdminAction() {
  await clearAdminSession();
  redirect("/acesso-admin");
}
