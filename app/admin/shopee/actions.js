"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { publishProduct, saveCategoryMapping, syncProduct } from "@/modules/shopee/service";

export async function saveMappingAction(formData) {
  await requireAdmin();
  const local = String(formData.get("categoria_id") || "");
  const raw = String(formData.get("shopee_categoria") || "");
  const [id, ...name] = raw.split("|");
  if (!local || !id) throw new Error("Selecione as duas categorias.");
  await saveCategoryMapping(local, id, name.join("|"));
  revalidatePath("/admin/shopee");
}

export async function publishProductAction(formData) {
  await requireAdmin();
  await publishProduct(String(formData.get("produto_id")));
  revalidatePath("/admin/shopee");
}

export async function syncProductAction(formData) {
  await requireAdmin();
  await syncProduct(String(formData.get("produto_id")));
  revalidatePath("/admin/shopee");
}
