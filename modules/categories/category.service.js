import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function getPublicCategories() {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("categorias")
    .select("id, nome, slug, descricao, imagem_url, ordem")
    .eq("ativo", true)
    .order("ordem", { ascending: true });

  if (error) {
    console.error("Erro ao buscar categorias:", error);
    return [];
  }

  return data ?? [];
}

export async function getCategoryBySlug(slug) {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("categorias")
    .select("id, nome, slug, descricao, imagem_url")
    .eq("slug", slug)
    .eq("ativo", true)
    .maybeSingle();

  if (error) {
    console.error("Erro ao buscar categoria:", error);
    return null;
  }

  return data;
}