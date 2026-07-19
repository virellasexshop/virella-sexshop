"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createCategory,
  getAdminCategories,
  updateCategory,
} from "@/modules/categories/category.service";
import { requireAdmin } from "@/lib/admin-auth";

function slugify(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function safeMessage(error) {
  if (error?.code === "23505") return "Já existe uma categoria com esse nome ou endereço.";
  return "Não foi possível salvar a categoria.";
}

export async function createCategoryAction(formData) {
  await requireAdmin();
  const nome = String(formData.get("nome") || "").trim();
  const slug = slugify(formData.get("slug") || nome);

  if (!nome || !slug) {
    redirect("/admin/categorias?erro=Informe%20o%20nome%20da%20categoria.");
  }

  let errorMessage = "";

  try {
    const categorias = await getAdminCategories();
    const ordemPadrao = categorias.length
      ? Math.max(...categorias.map((categoria) => Number(categoria.ordem) || 0)) + 1
      : 1;

    await createCategory({
      nome,
      slug,
      descricao: String(formData.get("descricao") || "").trim() || null,
      imagem_url: String(formData.get("imagem_url") || "").trim() || null,
      ordem: Number(formData.get("ordem") || ordemPadrao),
      ativo: formData.get("ativo") === "on",
    });
  } catch (error) {
    console.error("Erro ao criar categoria:", error);
    errorMessage = safeMessage(error);
  }

  if (errorMessage) {
    redirect(`/admin/categorias?erro=${encodeURIComponent(errorMessage)}`);
  }

  revalidatePath("/");
  revalidatePath("/catalogo");
  revalidatePath("/admin/categorias");
  redirect("/admin/categorias?sucesso=Categoria%20criada%20com%20sucesso.");
}

export async function updateCategoryAction(formData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  const nome = String(formData.get("nome") || "").trim();

  if (!id || !nome) {
    redirect("/admin/categorias?erro=Categoria%20inválida.");
  }

  let errorMessage = "";

  try {
    await updateCategory(id, {
      nome,
      slug: slugify(formData.get("slug") || nome),
      descricao: String(formData.get("descricao") || "").trim() || null,
      imagem_url: String(formData.get("imagem_url") || "").trim() || null,
      ordem: Number(formData.get("ordem") || 0),
      ativo: formData.get("ativo") === "on",
    });
  } catch (error) {
    console.error("Erro ao atualizar categoria:", error);
    errorMessage = safeMessage(error);
  }

  if (errorMessage) {
    redirect(`/admin/categorias?erro=${encodeURIComponent(errorMessage)}`);
  }

  revalidatePath("/");
  revalidatePath("/catalogo");
  revalidatePath("/categoria/[slug]", "page");
  revalidatePath("/admin/categorias");
  redirect("/admin/categorias?sucesso=Categoria%20atualizada.");
}
