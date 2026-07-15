import Link from "next/link";

export default function HomeCategories({ categorias = [] }) {
  return (
    <section className="homeCategories">
      <div className="container">
        <div className="homeCategoriesHeader">
          <div>
            <span className="kicker">Explore por categoria</span>
            <h2>Curadorias para diferentes momentos</h2>
          </div>

          <p>
            Encontre produtos selecionados para cuidado, prazer, autoestima e
            experiências mais sofisticadas.
          </p>
        </div>

        <div className="homeCategoriesGrid">
          {categorias.map((categoria, index) => (
            <Link
              href={`/categoria/${categoria.slug}`}
              className="homeCategoryCard"
              key={categoria.id}
            >
              <div className="homeCategoryVisual">
                {categoria.imagem_url ? (
                  <img
                    src={categoria.imagem_url}
                    alt={categoria.nome}
                  />
                ) : (
                  <div className="homeCategoryFallback">
                    <span>{String(index + 1).padStart(2, "0")}</span>
                  </div>
                )}

                <div className="homeCategoryOverlay" />
              </div>

              <div className="homeCategoryContent">
                <span className="homeCategoryLabel">Categoria</span>

                <h3>{categoria.nome}</h3>

                {categoria.descricao && (
                  <p>{categoria.descricao}</p>
                )}

                <div className="homeCategoryLink">
                  Explorar categoria
                  <span aria-hidden="true">→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}