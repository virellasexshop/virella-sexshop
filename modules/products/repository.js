import { createSupabaseAdminClient } from "@/lib/supabase/admin";

async function loadProductDetails(supabase, product) {
  if (!product) return null;

  const [{ data: images, error: imagesError }, { data: variations, error: variationsError }] =
    await Promise.all([
      supabase
        .from("produto_imagens")
        .select("id,url,ordem")
        .eq("produto_id", product.id)
        .order("ordem", { ascending: true }),
      supabase
        .from("produto_variacoes")
        .select("id,nome,sku,preco,quantidade,imagem_url,ativo,ordem")
        .eq("produto_id", product.id)
        .order("ordem", { ascending: true }),
    ]);

  if (imagesError) throw imagesError;
  if (variationsError) throw variationsError;

  return {
    ...product,
    produto_imagens: images || [],
    produto_variacoes: variations || [],
  };
}

export async function findAll() {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("produtos")
    .select("*, categorias!produtos_categoria_id_fkey(id,nome,slug), produto_variacoes(id,quantidade,ativo)")
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

  return loadProductDetails(supabase, data);
}

export async function findByIds(ids) {
  if (!Array.isArray(ids) || ids.length === 0) return [];
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("produtos")
    .select("*, categorias!produtos_categoria_id_fkey(id,nome,slug)")
    .in("id", ids.slice(0, 100));

  if (error) {
    console.error("Erro ao atualizar preços do carrinho:", error);
    return [];
  }

  return data ?? [];
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

  return loadProductDetails(supabase, data);
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
    .select("id,nome,slug,descricao,imagem_url")
    .eq("slug", categorySlug)
    .eq("ativo", true)
    .maybeSingle();

  if (!categoria) return { categoria: null, produtos: [] };

  const { data: produtos, error } = await supabase
    .from("produtos")
    .select("*, categorias!produtos_categoria_id_fkey(id,nome,slug)")
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

export async function createProductImages(productId, images) {
  if (!images?.length) return [];
  const supabase = createSupabaseAdminClient();
  const values = images.map((image, index) => ({
    produto_id: productId,
    url: image.url,
    ordem: Number.isInteger(image.ordem) ? image.ordem : index,
  }));
  const { data, error } = await supabase.from("produto_imagens").insert(values).select();
  if (error) throw error;
  return data || [];
}

export async function deleteProductImage(id) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("produto_imagens").delete().eq("id", id);
  if (error) throw error;
}

export async function createProductVariations(productId, variations) {
  if (!variations?.length) return [];
  const supabase = createSupabaseAdminClient();
  const values = variations.map((variation, index) => ({
    produto_id: productId,
    nome: variation.nome,
    sku: variation.sku || null,
    preco: variation.preco ?? null,
    quantidade: variation.quantidade,
    imagem_url: variation.imagem_url || null,
    ativo: variation.ativo !== false,
    ordem: Number.isInteger(variation.ordem) ? variation.ordem : index,
  }));
  const { data, error } = await supabase.from("produto_variacoes").insert(values).select();
  if (error) throw error;
  await syncProductStock(productId);
  return data || [];
}

export async function updateProductVariation(id, values) {
  const supabase = createSupabaseAdminClient();
  const { data: current, error: currentError } = await supabase
    .from("produto_variacoes")
    .select("produto_id")
    .eq("id", id)
    .single();
  if (currentError) throw currentError;

  const { data, error } = await supabase
    .from("produto_variacoes")
    .update({ ...values, atualizado_em: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  await syncProductStock(current.produto_id);
  return data;
}

export async function deleteProductVariation(id) {
  const supabase = createSupabaseAdminClient();
  const { data: current, error: currentError } = await supabase
    .from("produto_variacoes")
    .select("produto_id")
    .eq("id", id)
    .single();
  if (currentError) throw currentError;

  const { error } = await supabase.from("produto_variacoes").delete().eq("id", id);
  if (error) throw error;
  await syncProductStock(current.produto_id);
}

export async function findVariantsByIds(ids) {
  if (!Array.isArray(ids) || ids.length === 0) return [];
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("produto_variacoes")
    .select("id,produto_id,nome,sku,preco,quantidade,imagem_url,ativo,ordem")
    .in("id", ids.slice(0, 100));
  if (error) throw error;
  return data || [];
}

export async function findVariantsByProductIds(productIds) {
  if (!Array.isArray(productIds) || productIds.length === 0) return [];
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("produto_variacoes")
    .select("id,produto_id,nome,sku,preco,quantidade,imagem_url,ativo,ordem")
    .in("produto_id", productIds.slice(0, 100))
    .order("ordem", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function syncProductStock(productId) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("produto_variacoes")
    .select("quantidade")
    .eq("produto_id", productId)
    .eq("ativo", true);
  if (error) throw error;
  const quantidade = (data || []).reduce((total, variation) => total + Number(variation.quantidade || 0), 0);
  const { error: updateError } = await supabase
    .from("produtos")
    .update({ quantidade })
    .eq("id", productId);
  if (updateError) throw updateError;
}
