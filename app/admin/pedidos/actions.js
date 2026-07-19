"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { updateOrderStatus } from "@/modules/orders/order.service";

export async function updateOrderStatusAction(formData) {
  await requireAdmin();
  await updateOrderStatus(String(formData.get("pedido_id") || ""), String(formData.get("status_pedido") || ""));
  revalidatePath("/admin");
  revalidatePath("/admin/pedidos");
}
