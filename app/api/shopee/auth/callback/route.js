import { NextResponse } from "next/server";
import { saveAuthorization } from "@/modules/shopee/service";

export async function GET(request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const shopId = url.searchParams.get("shop_id");
  try {
    if (!code || !shopId) throw new Error("A Shopee não retornou a autorização completa.");
    await saveAuthorization({ code, shopId });
    return NextResponse.redirect(new URL("/admin/shopee?conectado=1", url.origin));
  } catch (error) {
    const redirect = new URL("/admin/shopee", url.origin);
    redirect.searchParams.set("erro", error.message);
    return NextResponse.redirect(redirect);
  }
}
