import { notFound } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CategoryCatalogClient from "@/components/catalog/CategoryCatalogClient";
import { getProductsByCategorySlug } from "@/modules/products/product.service";

export const dynamic = "force-dynamic";

export default async function CategoryPage({ params }) {
  const { slug } = await params;
  const { categoria, produtos } = await getProductsByCategorySlug(slug);

  if (!categoria) notFound();

  return (
    <>
      <Header />
      <main className="categoryPage">
        <section className="categoryHero">
          <div className="container">
            <span className="eyebrow">Coleção selecionada</span>
            <h1>{categoria.nome}</h1>
            <p>
              {categoria.descricao ||
                "Descubra uma seleção sofisticada, criada para experiências únicas."}
            </p>
          </div>
        </section>

        <section className="container categoryProducts categoryProductsPremium">
          <CategoryCatalogClient
            products={produtos}
            categoryName={categoria.nome}
          />
        </section>
      </main>
      <Footer />
    </>
  );
}
