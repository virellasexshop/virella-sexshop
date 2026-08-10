import { requireAdminApi, jsonError } from "@/lib/mercado-livre/api-auth";
import { getMercadoLivreCategoryAttributes } from "@/lib/mercado-livre/client";

export async function GET(request) {
  try {
    await requireAdminApi();
    const categoryId = new URL(request.url).searchParams.get("category_id") || "";
    if (!categoryId) return Response.json({ ok: false, error: "Informe category_id." }, { status: 400 });
    const attributes = await getMercadoLivreCategoryAttributes(categoryId);
    const required = attributes
      .filter((item) => item?.tags?.required)
      .map((item) => ({ id: item.id, name: item.name, value_type: item.value_type, values: item.values || [] }));
    const variationAttributes = attributes
      .filter((item) => item?.tags?.allow_variations)
      .map((item) => ({ id: item.id, name: item.name, value_type: item.value_type, values: item.values || [] }));
    return Response.json({ ok: true, required, variationAttributes });
  } catch (error) {
    return jsonError(error);
  }
}
