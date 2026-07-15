import Link from "next/link";

function formatPrice(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function ProductCard({ product }) {
  const price = product.preco_promocional || product.preco;
  const category = product.categorias?.nome || "Seleção premium";
  const href = `/produto/${product.slug || product.id}`;

  return (
    <article className="productCardPremium">
      <Link href={href} className="productImageLink" aria-label={`Ver ${product.nome}`}>
        <div
          className="productImagePremium"
          style={product.imagem_principal ? { backgroundImage: `url(${product.imagem_principal})` } : undefined}
        >
          <span className="productBadge">
            {product.mais_vendido ? "Mais vendido" : product.novo ? "Novo" : product.promocao ? "Oferta" : "Curadoria"}
          </span>
          <span className="productView">Ver detalhes</span>
        </div>
      </Link>

      <div className="productContentPremium">
        <p>{category}</p>
        <Link href={href}><h3>{product.nome}</h3></Link>
        <div className="productBuyRow">
          <strong>{formatPrice(price)}</strong>
          <Link href={href}>Conhecer</Link>
        </div>
      </div>
    </article>
  );
}
