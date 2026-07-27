import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function summarize(reviews) {
  const total = reviews.length;
  const average = total
    ? reviews.reduce((sum, review) => sum + Number(review.nota || 0), 0) / total
    : 0;

  const distribution = [5, 4, 3, 2, 1].map((score) => ({
    score,
    total: reviews.filter((review) => Number(review.nota) === score).length,
  }));

  return { total, average, distribution };
}

export async function getProductReviews(productId) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("avaliacoes")
    .select("id,nota,comentario,nome_exibicao,compra_verificada,origem,criado_em")
    .eq("produto_id", productId)
    .eq("ativo", true)
    .order("criado_em", { ascending: false });

  if (error) return { reviews: [], summary: summarize([]) };

  const reviews = data || [];
  return { reviews, summary: summarize(reviews) };
}

export async function getLatestReviews(limit = 3) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("avaliacoes")
    .select("id,nota,comentario,nome_exibicao,compra_verificada,origem,produto_nome_snapshot,produto_preco_snapshot,criado_em,produtos(nome,slug)")
    .eq("ativo", true)
    .order("criado_em", { ascending: false })
    .limit(limit);

  if (error) return [];
  return data || [];
}

export async function getAdminReviews() {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("avaliacoes")
    .select("id,nota,comentario,nome_exibicao,compra_verificada,origem,produto_nome_snapshot,produto_preco_snapshot,ativo,criado_em,produtos(nome,slug)")
    .order("criado_em", { ascending: false });

  if (error) return [];
  return data || [];
}

export async function setReviewVisibility(id, active) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("avaliacoes")
    .update({ ativo: active, atualizado_em: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteReview(id) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("avaliacoes").delete().eq("id", id);
  if (error) throw error;
}

export async function createManualReview({
  product,
  displayName,
  rating,
  comment,
}) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("avaliacoes").insert({
    produto_id: product.id,
    usuario_id: null,
    nome_exibicao: displayName,
    nota: rating,
    comentario: comment,
    origem: "loja",
    compra_verificada: false,
    produto_nome_snapshot: product.nome,
    produto_preco_snapshot: product.preco_final ?? product.preco,
    ativo: true,
  });

  if (error) throw error;
}
