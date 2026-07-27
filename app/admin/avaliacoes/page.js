import Link from "next/link";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { getAdminReviews } from "@/modules/reviews/review.service";
import { getAdminProducts } from "@/modules/products/product.service";
import {
  createManualReviewAction,
  deleteReviewAction,
  toggleReviewAction,
} from "./actions";
import styles from "./avaliacoes.module.css";

export const dynamic = "force-dynamic";

function formatDate(value) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function productPrice(product) {
  if (product.promocao && product.preco_promocional != null) {
    return product.preco_promocional;
  }
  return product.preco;
}

export default async function AdminReviewsPage({ searchParams }) {
  const params = await searchParams;
  const [reviews, products] = await Promise.all([
    getAdminReviews(),
    getAdminProducts(),
  ]);

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

        {params?.criada === "1" && (
          <p className={styles.success}>Depoimento adicionado com sucesso.</p>
        )}
        {params?.erro && (
          <p className={styles.error}>
            Não foi possível adicionar. Confira todos os campos e tente novamente.
          </p>
        )}

        <section className={styles.createPanel}>
          <div className={styles.createIntro}>
            <span>Cadastro manual</span>
            <h2>Adicionar depoimento recebido</h2>
            <p>
              Use somente feedbacks reais recebidos por atendimento, WhatsApp ou
              Instagram. Eles aparecerão como “Depoimento recebido pela loja”.
            </p>
          </div>

          <form action={createManualReviewAction} className={styles.createForm}>
            <label className={styles.fullField}>
              <span>Produto comprado</span>
              <select name="produto_id" required defaultValue="">
                <option value="" disabled>Selecione pelo nome e valor</option>
                {products.map((product) => (
                  <option value={product.id} key={product.id}>
                    {product.nome} — {formatMoney(productPrice(product))}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Nome exibido do cliente</span>
              <input
                name="nome_exibicao"
                minLength={2}
                maxLength={60}
                placeholder="Ex.: Mariana S."
                required
              />
            </label>

            <label>
              <span>Estrelas</span>
              <select name="nota" defaultValue="5" required>
                <option value="5">5 estrelas</option>
                <option value="4">4 estrelas</option>
                <option value="3">3 estrelas</option>
                <option value="2">2 estrelas</option>
                <option value="1">1 estrela</option>
                <option value="0">0 estrelas</option>
              </select>
            </label>

            <label className={styles.fullField}>
              <span>Comentário</span>
              <textarea
                name="comentario"
                rows={5}
                minLength={10}
                maxLength={700}
                placeholder="Digite o depoimento real recebido do cliente."
                required
              />
            </label>

            <div className={`${styles.fullField} ${styles.createActions}`}>
              <small>
                O produto e o valor são registrados automaticamente conforme a opção escolhida.
              </small>
              <button type="submit">Adicionar depoimento</button>
            </div>
          </form>
        </section>

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
                  {review.origem === "loja" && <strong>Depoimento recebido</strong>}
                  {!review.ativo && <strong className={styles.hidden}>Oculta</strong>}
                </div>
                <blockquote>“{review.comentario}”</blockquote>
                <div className={styles.footer}>
                  <div>
                    <strong>{review.nome_exibicao}</strong>
                    {review.produtos?.slug ? (
                      <Link href={`/produto/${review.produtos.slug}`} target="_blank">
                        {review.produto_nome_snapshot || review.produtos.nome}
                        {review.produto_preco_snapshot != null
                          ? ` — ${formatMoney(review.produto_preco_snapshot)}`
                          : ""} ↗
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
