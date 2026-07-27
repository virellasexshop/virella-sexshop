"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import {
  deleteReview,
  setReviewVisibility,
} from "@/modules/reviews/review.service";

export async function toggleReviewAction(formData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  const active = String(formData.get("ativo")) === "true";
  if (!id) return;

  await setReviewVisibility(id, active);
  revalidatePath("/");
  revalidatePath("/produto/[id]", "page");
  revalidatePath("/admin/avaliacoes");
}

export async function deleteReviewAction(formData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  if (!id) return;

  await deleteReview(id);
  revalidatePath("/");
  revalidatePath("/produto/[id]", "page");
  revalidatePath("/admin/avaliacoes");
}
