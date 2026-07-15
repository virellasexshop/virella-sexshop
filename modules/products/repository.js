import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function findAll() {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("produtos")
    .select("*, categorias(id,nome,slug)")
    .order("criado_em", { ascending: false });

  if (error) {
    console.error("Erro ao buscar produtos:", error);
    return [];
  }

  return data ?? [];
}

export async function findById(id) {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("produtos")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Erro ao buscar produto:", error);
    return null;
  }

  return data;
}

export async function createProduct(values) {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("produtos")
    .insert(values)
    .select()
    .single();

  if (error) {
    console.error("Erro ao criar produto:", error);
    throw error;
  }

  return data;
}

export async function updateProduct(id, values) {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("produtos")
    .update(values)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Erro ao atualizar produto:", error);
    throw error;
  }

  return data;
}

export async function deleteProduct(id) {
  const supabase = createSupabaseAdminClient();

  const { error } = await supabase
    .from("produtos")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Erro ao excluir produto:", error);
    throw error;
  }

  return true;
}
export async function findBySlug(slug) {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("produtos")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("Erro ao buscar slug:", error);
    return null;
  }

  return data;
}
export async function findFeaturedProducts() {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("produtos")
    .select("*")
    .eq("ativo", true)
    .or("destaque.eq.true,mais_vendido.eq.true,novo.eq.true,promocao.eq.true")
    .order("criado_em", { ascending: false });

  if (error) {
    console.error("Erro ao buscar produtos da home:", error);
    return [];
  }

  return data ?? [];
}

export async function findProductsByCategorySlug(categorySlug) {
  const supabase = createSupabaseAdminClient();

  const { data: categoria } = await supabase
    .from("categorias")
    .select("id,nome,slug,descricao")
    .eq("slug", categorySlug)
    .single();

  if (!categoria) return { categoria: null, produtos: [] };

  const { data: produtos, error } = await supabase
    .from("produtos")
    .select("*")
    .eq("ativo", true)
    .eq("categoria_id", categoria.id)
    .order("criado_em", { ascending: false });

  if (error) {
    console.error("Erro ao buscar produtos da categoria:", error);
    return { categoria, produtos: [] };
  }

  return {
    categoria,
    produtos: produtos ?? [],
  };
}
export async function findBestSellerProducts() {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("produtos")
    .select("*")
    .eq("ativo", true)
    .eq("mais_vendido", true)
    .order("criado_em", { ascending: false })
    .limit(4);

  if (error) {
    console.error("Erro ao buscar mais vendidos:", error);
    return [];
  }

  return data ?? [];
}

export async function findNewProducts() {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("produtos")
    .select("*")
    .eq("ativo", true)
    .eq("novo", true)
    .order("criado_em", { ascending: false })
    .limit(4);

  if (error) {
    console.error("Erro ao buscar novidades:", error);
    return [];
  }

  return data ?? [];
}
export async function findProductsByCategoryId(categoryId) {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("produtos")
    .select("*")
    .eq("ativo", true)
    .eq("categoria_id", categoryId)
    .order("criado_em", { ascending: false });

  if (error) {
    console.error("Erro ao buscar produtos da categoria:", error);
    return [];
  }

  return data ?? [];
}