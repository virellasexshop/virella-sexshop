import Link from "next/link";

export default function Categories({ categorias = [] }) {
  return (
    <section className="categoriesSection">
      <div className="container">
        <div className="sectionHeader">
          <span className="kicker">Categorias</span>
          <h2>Escolha por experiência</h2>
          <p>
            Navegue por seleções criadas para facilitar sua escolha com discrição,
            conforto e sofisticação.
          </p>
        </div>

        <div className="categoriesGrid">
          {categorias.map((categoria) => (
            <Link
              href={`/categoria/${categoria.slug}`}
              className="categoryCard"
              key={categoria.id}
            >
              <span>{categoria.nome}</span>
              <small>{categoria.descricao}</small>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}