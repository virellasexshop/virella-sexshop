"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import {
  createManualReview,
  deleteReview,
  setReviewVisibility,
} from "@/modules/reviews/review.service";
import { getProductById } from "@/modules/products/product.service";

export async function createManualReviewAction(formData) {
  await requireAdmin();

  const productId = String(formData.get("produto_id") || "").trim();
  const displayName = String(formData.get("nome_exibicao") || "").trim();
  const comment = String(formData.get("comentario") || "").trim();
  const rating = Number(formData.get("nota"));

  if (
    !productId ||
    displayName.length < 2 ||
    displayName.length > 60 ||
    comment.length < 10 ||
    comment.length > 700 ||
    !Number.isInteger(rating) ||
    rating < 0 ||
    rating > 5
  ) {
    redirect("/admin/avaliacoes?erro=dados");
  }

  const product = await getProductById(productId);
  if (!product) redirect("/admin/avaliacoes?erro=produto");

  await createManualReview({
    product,
    displayName,
    rating,
    comment,
  });

  revalidatePath("/");
  revalidatePath(`/produto/${product.slug || product.id}`);
  revalidatePath("/admin/avaliacoes");
  redirect("/admin/avaliacoes?criada=1");
}

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
