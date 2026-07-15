import Link from "next/link";

const categories = [
  {
    label: "01",
    title: "Cosméticos sensoriais",
    text: "Texturas, aromas e fórmulas para transformar o toque em ritual.",
    href: "/catalogo?categoria=cosmeticos",
  },
  {
    label: "02",
    title: "Vibradores premium",
    text: "Tecnologia silenciosa, design elegante e experiência refinada.",
    href: "/catalogo?categoria=vibradores",
  },
  {
    label: "03",
    title: "Lingeries selecionadas",
    text: "Peças para autoestima, presença e sofisticação íntima.",
    href: "/catalogo?categoria=lingeries",
  },
];

export default function CategoryShowcase() {
  return (
    <section className="categoryEditorial">
      <div className="container">
        <div className="categoryEditorialHeader">
          <span className="kicker">Curadoria por categoria</span>
          <h2>Uma boutique pensada para escolhas discretas.</h2>
        </div>

        <div className="categoryEditorialList">
          {categories.map((item) => (
            <Link href={item.href} className="categoryEditorialItem" key={item.title}>
              <span className="categoryNumber">{item.label}</span>

              <div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>

              <strong>Explorar</strong>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}