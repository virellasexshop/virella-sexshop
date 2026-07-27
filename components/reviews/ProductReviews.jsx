"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import styles from "./ProductReviews.module.css";

function formatDate(value) {
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function privateName(value) {
  const parts = String(value || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "Cliente Virella";
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts.at(-1).charAt(0).toUpperCase()}.`;
}

function Stars({ value, label = true }) {
  return (
    <span className={styles.stars} aria-label={label ? `${value} de 5 estrelas` : undefined}>
      {"★★★★★".split("").map((star, index) => (
        <span key={index} className={index < value ? styles.filled : ""}>{star}</span>
      ))}
    </span>
  );
}

export default function ProductReviews({
  productId,
  productSlug,
  reviews = [],
  summary = { total: 0, average: 0, distribution: [] },
}) {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [user, setUser] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const currentUser = data?.user || null;
      setUser(currentUser);
      setDisplayName(
        privateName(currentUser?.user_metadata?.nome || currentUser?.email?.split("@")[0])
      );
    });
  }, [supabase]);

  async function submitReview(event) {
    event.preventDefault();
    if (!user) return;

    setSubmitting(true);
    setMessage("");

    const payload = {
      produto_id: productId,
      usuario_id: user.id,
      nome_exibicao: displayName.trim(),
      nota: rating,
      comentario: comment.trim(),
    };

    const { error } = await supabase
      .from("avaliacoes")
      .upsert(payload, { onConflict: "produto_id,usuario_id" });

    if (error) {
      const purchaseRequired =
        error.message?.toLowerCase().includes("compra aprovada") ||
        error.message?.toLowerCase().includes("verified purchase");
      setMessage(
        purchaseRequired
          ? "A avaliação é liberada depois que o pagamento deste produto for aprovado."
          : "Não foi possível publicar. Confira os campos e tente novamente."
      );
    } else {
      setMessage("Sua avaliação foi publicada com sucesso.");
      setComment("");
      router.refresh();
    }

    setSubmitting(false);
  }

  return (
    <section id="avaliacoes" className={styles.section}>
      <div className={styles.header}>
        <div>
          <span className="eyebrow">Experiências reais</span>
          <h2>Avaliações de clientes</h2>
          <p>Somente compras com pagamento aprovado recebem o selo verificado.</p>
        </div>

        <div className={styles.summary}>
          <strong>{summary.total ? Number(summary.average).toFixed(1).replace(".", ",") : "—"}</strong>
          <div>
            <Stars value={Math.round(summary.average || 0)} />
            <span>
              {summary.total} {summary.total === 1 ? "avaliação" : "avaliações"}
            </span>
          </div>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.list}>
          {reviews.length ? reviews.map((review) => (
            <article className={styles.review} key={review.id}>
              <div className={styles.reviewTop}>
                <Stars value={review.nota} />
                <span>{formatDate(review.criado_em)}</span>
              </div>
              <p>“{review.comentario}”</p>
              <footer>
                <strong>{review.nome_exibicao}</strong>
                {review.compra_verificada ? (
                  <span>✓ Compra verificada</span>
                ) : review.origem === "loja" ? (
                  <span>Depoimento recebido pela loja</span>
                ) : null}
              </footer>
            </article>
          )) : (
            <div className={styles.empty}>
              <strong>Este produto ainda não recebeu avaliações.</strong>
              <p>Se você já comprou, compartilhe sua experiência e ajude outras pessoas.</p>
            </div>
          )}
        </div>

        <aside className={styles.formCard}>
          <span className={styles.formKicker}>Sua experiência</span>
          <h3>Avalie este produto</h3>

          {!user ? (
            <div className={styles.loginPrompt}>
              <p>Entre na sua conta para publicar uma avaliação verificada.</p>
              <Link href={`/login?redirect=${encodeURIComponent(`/produto/${productSlug}#avaliacoes`)}`}>
                Entrar para avaliar
              </Link>
            </div>
          ) : (
            <form onSubmit={submitReview}>
              <fieldset>
                <legend>Sua nota</legend>
                <div className={styles.ratingInput}>
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      type="button"
                      key={value}
                      className={value <= rating ? styles.selectedStar : ""}
                      onClick={() => setRating(value)}
                      aria-label={`${value} ${value === 1 ? "estrela" : "estrelas"}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </fieldset>

              <label>
                <span>Nome exibido</span>
                <input
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  minLength={2}
                  maxLength={60}
                  required
                />
              </label>

              <label>
                <span>Conte como foi sua experiência</span>
                <textarea
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  minLength={10}
                  maxLength={700}
                  rows={5}
                  required
                  placeholder="Qualidade, experiência de uso, embalagem..."
                />
              </label>

              {message && <p className={styles.message}>{message}</p>}

              <button type="submit" className={styles.submit} disabled={submitting}>
                {submitting ? "Publicando..." : "Publicar avaliação"}
              </button>
              <small>Ao reenviar, sua avaliação anterior será atualizada.</small>
            </form>
          )}
        </aside>
      </div>
    </section>
  );
}
