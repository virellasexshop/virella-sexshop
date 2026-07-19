import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { unstable_noStore as noStore } from "next/cache";

export async function getAdminCategories() {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("categorias")
    .select("id, nome, slug, descricao, imagem_url, ordem, ativo")
    .order("ordem", { ascending: true })
    .order("nome", { ascending: true });

  if (error) {
    console.error("Erro ao buscar categorias do painel:", error);
    return [];
  }

  return data ?? [];
}

export async function getPublicCategories() {
  noStore();
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

export async function createCategory(values) {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("categorias")
    .insert(values)
    .select("id, nome, slug, descricao, imagem_url, ordem, ativo")
    .single();

  if (error) throw error;
  return data;
}

export async function updateCategory(id, values) {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("categorias")
    .update(values)
    .eq("id", id)
    .select("id, nome, slug, descricao, imagem_url, ordem, ativo")
    .single();

  if (error) throw error;
  return data;
}
