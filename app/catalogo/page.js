import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CatalogClient from "@/components/catalog/CatalogClient";
import { getAdminProducts } from "@/modules/products/product.service";
import { getPublicCategories } from "@/modules/categories/category.service";

export const metadata = {
  title: "Catálogo | Virella Sexshop",
  description: "Explore a curadoria completa da Virella Sexshop, organizada por categorias.",
};

export default async function CatalogoPage() {
  const [products, categories] = await Promise.all([
    getAdminProducts(),
    getPublicCategories(),
  ]);

  const publicProducts = products.filter((product) => product.ativo !== false);

  return (
    <>
      <Header />
      <main className="catalogPage">
        <section className="catalogHero">
          <div className="container catalogHeroGrid">
            <div>
              <span className="eyebrow">Curadoria Virella Sexshop</span>
              <h1>Uma coleção criada para despertar sensações.</h1>
            </div>
            <div className="catalogHeroCopy">
              <p>
                Cosméticos, acessórios e peças selecionadas com cuidado para unir
                design, qualidade e absoluta discrição.
              </p>
              <span>{publicProducts.length} itens selecionados</span>
            </div>
          </div>
        </section>

        <CatalogClient products={publicProducts} categories={categories} />
      </main>
      <Footer />
    </>
  );
}
