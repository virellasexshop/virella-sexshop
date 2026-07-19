import { unstable_noStore as noStore } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { enrichProductPricing } from "@/lib/pricing";

export const DEFAULT_PROMOTION_SETTINGS = {
  id: "principal",
  promocao_global_ativa: false,
  desconto_global_percentual: 0,
};

export async function getPromotionSettings() {
  noStore();
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("configuracoes_promocao")
    .select("id, promocao_global_ativa, desconto_global_percentual, atualizado_em")
    .eq("id", "principal")
    .maybeSingle();

  if (error) {
    console.error("Erro ao buscar configurações de promoção:", error);
    return DEFAULT_PROMOTION_SETTINGS;
  }

  return data || DEFAULT_PROMOTION_SETTINGS;
}

export async function savePromotionSettings(values) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("configuracoes_promocao")
    .upsert({
      id: "principal",
      promocao_global_ativa: Boolean(values.promocao_global_ativa),
      desconto_global_percentual: Number(values.desconto_global_percentual || 0),
      atualizado_em: new Date().toISOString(),
    }, { onConflict: "id" })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function enrichProductsWithPromotions(products) {
  const settings = await getPromotionSettings();
  return (products || []).map((product) => enrichProductPricing(product, settings));
}

export async function enrichProductWithPromotions(product) {
  if (!product) return null;
  const settings = await getPromotionSettings();
  return enrichProductPricing(product, settings);
}
