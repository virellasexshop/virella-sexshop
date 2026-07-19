"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { savePromotionSettings } from "@/modules/promotions/promotion.service";

function parseMoney(value) {
  let text = String(value || "").trim().replace(/r\$/gi, "").replace(/\s/g, "");
  if (!text) return null;
  if (text.includes(",") && text.includes(".")) {
    text = text.lastIndexOf(",") > text.lastIndexOf(".")
      ? text.replace(/\./g, "").replace(",", ".")
      : text.replace(/,/g, "");
  } else if (text.includes(",")) {
    text = text.replace(",", ".");
  }
  const number = Number(text);
  return Number.isFinite(number) ? number : null;
}

function refreshPromotionPages() {
  revalidatePath("/");
  revalidatePath("/catalogo");
  revalidatePath("/carrinho");
  revalidatePath("/categoria/[slug]", "page");
  revalidatePath("/produto/[id]", "page");
  revalidatePath("/admin/promocoes");
  revalidatePath("/admin/produtos");
}

export async function updateGlobalPromotionAction(formData) {
  await requireAdmin();
  const percentage = Number(String(formData.get("percentual") || "0").replace(",", "."));
  const active = formData.get("ativa") === "on";

  if (!Number.isFinite(percentage) || percentage < 0 || percentage >= 100) {
    redirect("/admin/promocoes?erro=Informe%20um%20desconto%20entre%200%20e%2099%25.");
  }

  let errorMessage = "";
  try {
    await savePromotionSettings({
      promocao_global_ativa: active && percentage > 0,
      desconto_global_percentual: percentage,
    });
  } catch (error) {
    console.error("Erro ao salvar promoção global:", error);
    errorMessage = "Execute o arquivo SQL de promoções no Supabase antes de usar esta tela.";
  }

  if (errorMessage) redirect(`/admin/promocoes?erro=${encodeURIComponent(errorMessage)}`);
  refreshPromotionPages();
  redirect(`/admin/promocoes?sucesso=${encodeURIComponent(active ? `Desconto global de ${percentage}% ativado.` : "Promoção global desativada. Os preços originais voltaram.")}`);
}

export async function updateProductPromotionAction(formData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  const originalPrice = parseMoney(formData.get("preco_original"));
  const promotionalPrice = parseMoney(formData.get("preco_promocional"));
  const active = formData.get("promocao") === "on";

  if (!id || originalPrice === null) {
    redirect("/admin/promocoes?erro=Produto%20inválido.");
  }

  if (active && (promotionalPrice === null || promotionalPrice <= 0 || promotionalPrice >= originalPrice)) {
    redirect("/admin/promocoes?erro=O%20preço%20promocional%20deve%20ser%20menor%20que%20o%20original.");
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("produtos")
    .update({
      promocao: active,
      preco_promocional: promotionalPrice,
    })
    .eq("id", id);

  if (error) {
    console.error("Erro ao atualizar promoção individual:", error);
    redirect("/admin/promocoes?erro=Não%20foi%20possível%20atualizar%20o%20produto.");
  }

  refreshPromotionPages();
  redirect(`/admin/promocoes?sucesso=${encodeURIComponent(active ? "Promoção individual ativada." : "Promoção removida. O preço original voltou.")}`);
}

export async function disableAllProductPromotionsAction() {
  await requireAdmin();
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("produtos")
    .update({ promocao: false })
    .eq("promocao", true);

  if (error) {
    console.error("Erro ao encerrar promoções:", error);
    redirect("/admin/promocoes?erro=Não%20foi%20possível%20encerrar%20as%20promoções.");
  }

  refreshPromotionPages();
  redirect("/admin/promocoes?sucesso=Todas%20as%20promoções%20individuais%20foram%20encerradas.");
}
