import Link from "next/link";
import styles from "./HomeTrust.module.css";

function Stars({ value }) {
  return (
    <span className={styles.homeReviewStars} aria-label={`${value} de 5 estrelas`}>
      {"★★★★★".split("").map((star, index) => (
        <span key={index} className={index < value ? styles.filled : ""}>{star}</span>
      ))}
    </span>
  );
}

export default function HomeReviews({ reviews = [] }) {
  if (!reviews.length) return null;

  return (
    <section className={styles.homeReviewsSection}>
      <div className="container">
        <div className={styles.homeReviewsHeader}>
          <div>
            <span className="kicker">Experiências reais</span>
            <h2>Quem compra, recomenda.</h2>
          </div>
          <p>
            Avaliações publicadas por clientes que concluíram uma compra na Virella.
          </p>
        </div>

        <div className={styles.homeReviewsGrid}>
          {reviews.map((review) => (
            <article className={styles.homeReviewCard} key={review.id}>
              <Stars value={review.nota} />
              <blockquote>“{review.comentario}”</blockquote>
              <footer>
                <div>
                  <strong>{review.nome_exibicao}</strong>
                  {review.compra_verificada && <span>Compra verificada</span>}
                </div>
                {review.produtos?.slug && (
                  <Link href={`/produto/${review.produtos.slug}`}>
                    {review.produtos.nome} ↗
                  </Link>
                )}
              </footer>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
