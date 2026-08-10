import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function getMercadoLivreAccount() {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("mercado_livre_contas")
    .select("*")
    .eq("site_id", "MLB")
    .order("atualizado_em", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

export async function saveMercadoLivreAccount(values) {
  const supabase = createSupabaseAdminClient();
  const row = {
    site_id: "MLB",
    seller_id: String(values.seller_id),
    nickname: values.nickname || null,
    access_token: values.access_token,
    refresh_token: values.refresh_token || null,
    token_expires_at: values.token_expires_at,
    scope: values.scope || null,
    atualizado_em: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("mercado_livre_contas")
    .upsert(row, { onConflict: "seller_id" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function clearMercadoLivreAccounts() {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("mercado_livre_contas")
    .delete()
    .eq("site_id", "MLB");
  if (error) throw error;
}
