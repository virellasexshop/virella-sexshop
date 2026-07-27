import Link from "next/link";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { getAdminReviews } from "@/modules/reviews/review.service";
import { deleteReviewAction, toggleReviewAction } from "./actions";
import styles from "./avaliacoes.module.css";

export const dynamic = "force-dynamic";

function formatDate(value) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

export default async function AdminReviewsPage() {
  const reviews = await getAdminReviews();

  return (
    <main className="adminShell">
      <AdminSidebar />
      <section className="adminContent">
        <div className="adminTop">
          <div>
            <span className="kicker">Prova social</span>
            <h1>Avaliações</h1>
          </div>
          <span className={styles.count}>{reviews.length} publicadas</span>
        </div>

        {!reviews.length ? (
          <div className="adminPanel">
            <h2>Nenhuma avaliação ainda</h2>
            <p>As avaliações verificadas dos clientes aparecerão aqui.</p>
          </div>
        ) : (
          <div className={styles.list}>
            {reviews.map((review) => (
              <article className={styles.card} key={review.id}>
                <div className={styles.meta}>
                  <span className={styles.stars}>
                    {"★".repeat(review.nota)}{"☆".repeat(5 - review.nota)}
                  </span>
                  <span>{formatDate(review.criado_em)}</span>
                  {review.compra_verificada && <strong>Compra verificada</strong>}
                  {!review.ativo && <strong className={styles.hidden}>Oculta</strong>}
                </div>
                <blockquote>“{review.comentario}”</blockquote>
                <div className={styles.footer}>
                  <div>
                    <strong>{review.nome_exibicao}</strong>
                    {review.produtos?.slug ? (
                      <Link href={`/produto/${review.produtos.slug}`} target="_blank">
                        {review.produtos.nome} ↗
                      </Link>
                    ) : (
                      <span>Produto removido</span>
                    )}
                  </div>

                  <div className={styles.actions}>
                    <form action={toggleReviewAction}>
                      <input type="hidden" name="id" value={review.id} />
                      <input type="hidden" name="ativo" value={review.ativo ? "false" : "true"} />
                      <button type="submit">
                        {review.ativo ? "Ocultar" : "Exibir"}
                      </button>
                    </form>
                    <form action={deleteReviewAction}>
                      <input type="hidden" name="id" value={review.id} />
                      <button type="submit" className={styles.danger}>Excluir</button>
                    </form>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
