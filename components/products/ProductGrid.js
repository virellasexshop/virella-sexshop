import ProductCard from "./ProductCard";

export default function ProductGrid({ title, subtitle, products }) {
  return (
    <section className="productSection">
      <div className="container">
        <div className="productSectionHeader">
          <div>
            <span className="kicker">Vitrine</span>
            <h2>{title}</h2>
          </div>

          <p>{subtitle}</p>
        </div>

        <div className="productGrid">
          {products.map((product) => (
            <ProductCard product={product} key={product.id || product.slug} />
          ))}
        </div>
      </div>
    </section>
  );
}
