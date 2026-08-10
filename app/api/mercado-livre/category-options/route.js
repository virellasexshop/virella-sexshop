import { requireAdminApi, jsonError } from "@/lib/mercado-livre/api-auth";
import {
  getMercadoLivreCategory,
  getMercadoLivreTopCategories,
} from "@/lib/mercado-livre/client";

export async function GET(request) {
  try {
    await requireAdminApi();
    const parentId = new URL(request.url).searchParams.get("parent_id") || "";

    if (!parentId) {
      const categories = await getMercadoLivreTopCategories();
      return Response.json({ ok: true, parent: null, categories, leaf: false });
    }

    const category = await getMercadoLivreCategory(parentId);
    const children = Array.isArray(category?.children_categories)
      ? category.children_categories.map((item) => ({ id: item.id, name: item.name }))
      : [];

    return Response.json({
      ok: true,
      parent: { id: category.id, name: category.name },
      categories: children,
      leaf: children.length === 0,
    });
  } catch (error) {
    return jsonError(error);
  }
}
