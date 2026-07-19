import Link from "next/link";
import styles from "./ProductCard.module.css";

function formatPrice(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function ProductCard({ product }) {
  const price = product.preco_final ?? product.preco;
  const category = product.categorias?.nome || "Seleção premium";
  const href = `/produto/${product.slug || product.id}`;

  return (
    <article className={styles.card}>
      <Link href={href} className={styles.imageLink} aria-label={`Ver ${product.nome}`}>
        <div
          className={styles.image}
          style={product.imagem_principal ? { backgroundImage: `url(${product.imagem_principal})` } : undefined}
        >
          <span className={styles.badge}>
            {product.em_promocao
              ? `${product.desconto_percentual}% OFF`
              : product.mais_vendido
                ? "Mais vendido"
                : product.novo
                  ? "Novo"
                  : "Curadoria"}
          </span>

          {!product.imagem_principal && (
            <span className={styles.placeholder}>V</span>
          )}

          <span className={styles.imageAction}>Ver detalhes ↗</span>
        </div>
      </Link>

      <div className={styles.info}>
        <span className={styles.category}>{category}</span>

        <Link href={href} className={styles.name}>
          <h3>{product.nome}</h3>
        </Link>

        <div className={styles.footer}>
          <div className={styles.price}>
            {product.em_promocao ? (
              <small className={styles.oldPrice}>{formatPrice(product.preco_original ?? product.preco)}</small>
            ) : (
              <small>Preço</small>
            )}
            <strong>{formatPrice(price)}</strong>
          </div>

          <Link
            href={href}
            className={styles.action}
            aria-label={`Conhecer ${product.nome}`}
          >
            <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
