import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { shopeeAuthUrl } from "@/lib/shopee/client";

export async function GET(request) {
  await requireAdmin();
  const origin = new URL(request.url).origin;
  return NextResponse.redirect(shopeeAuthUrl(`${origin}/api/shopee/auth/callback`));
}
