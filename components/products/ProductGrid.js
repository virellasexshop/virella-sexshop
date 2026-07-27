import ProductCard from "./ProductCard";
import gridStyles from "./MobileProductGrid.module.css";

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

        <div className={`productGrid ${gridStyles.grid}`}>
          {products.map((product) => (
            <ProductCard product={product} key={product.id || product.slug} />
          ))}
        </div>
      </div>
    </section>
  );
}
