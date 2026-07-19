import Link from "next/link";

export default function HomeCategories({ categorias = [] }) {
  return (
    <section className="homeCategories">
      <div className="container">
        <div className="homeCategoriesHeader">
          <div>
            <span className="kicker">Coleções Virella</span>
            <h2>Escolha o seu momento.</h2>
          </div>

          <div className="homeCategoriesIntro">
            <p>
              Uma curadoria delicada para explorar novas sensações com
              liberdade, privacidade e elegância.
            </p>

            <Link href="/catalogo" className="homeCategoriesAll">
              Ver catálogo completo
              <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>

        <div className="homeCategoriesGrid">
          {categorias.map((categoria) => (
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
                    <span>{categoria.nome?.charAt(0) || "V"}</span>
                  </div>
                )}

                <div className="homeCategoryOverlay" />
              </div>

              <div className="homeCategoryTopline">
                <span>Coleção Virella</span>
              </div>

              <div className="homeCategoryContent">
                <h3>{categoria.nome}</h3>

                {categoria.descricao && (
                  <p>{categoria.descricao}</p>
                )}

                <div className="homeCategoryLink">
                  <span>Descobrir coleção</span>
                  <strong aria-hidden="true">↗</strong>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
