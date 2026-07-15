import Link from "next/link";

const products = [
  {
    name: "Gel sensorial premium",
    category: "Cosméticos",
    price: "R$ 49,90",
  },
  {
    name: "Vibrador discreto soft touch",
    category: "Vibradores",
    price: "R$ 189,90",
  },
  {
    name: "Óleo corporal beijável",
    category: "Cosméticos",
    price: "R$ 39,90",
  },
  {
    name: "Kit noite especial",
    category: "Kits",
    price: "R$ 129,90",
  },
];

export default function BestSellers() {
  return (
    <section className="bestSellers">
      <div className="container">
        <div className="bestHeader">
          <div>
            <span className="kicker">Mais comprados</span>
            <h2>Favoritos escolhidos com discrição.</h2>
          </div>

          <Link href="/catalogo" className="viewAll">
            Ver catálogo
          </Link>
        </div>

        <div className="bestGrid">
          {products.map((product) => (
            <Link href="/produto" className="bestCard" key={product.name}>
              <div className="bestImage">
                <span>{product.category}</span>
              </div>

              <div className="bestInfo">
                <p>{product.category}</p>
                <h3>{product.name}</h3>

                <div>
                  <strong>{product.price}</strong>
                  <button>Comprar</button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}