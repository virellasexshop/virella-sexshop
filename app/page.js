import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ProductGrid from "@/components/products/ProductGrid";
import EditorialBanner from "@/components/home/EditorialBanner";
import HomeCategories from "@/components/home/HomeCategories";
import Newsletter from "@/components/home/Newsletter";
import { getPublicCategories } from "@/modules/categories/category.service";

import {
  getBestSellerProducts,
  getNewProducts,
} from "@/modules/products/product.service";

export default async function Home() {
  const bestSellers = await getBestSellerProducts();
  const newProducts = await getNewProducts();
  const categorias = await getPublicCategories();
  return (
    <>
      <Header />

      <main>
        <section className="homeHero">
          <div className="container homeHeroGrid">
            <div className="homeHeroText">
              <span className="kicker">Boutique íntima premium</span>

              <h1>Desejo, cuidado e discrição em uma experiência sofisticada.</h1>

              <p>
                Produtos selecionados para quem valoriza privacidade, estética
                e uma compra elegante do início ao fim.
              </p>

              <div className="heroButtons">
                <a href="/catalogo" className="btn">
                  Explorar coleção
                </a>

                <a href="/catalogo?categoria=novidades" className="btn btnGhost">
                  Ver novidades
                </a>
              </div>
            </div>

            <div className="homeHeroVisual">
              <span>Curadoria Premium</span>
              <h2>Intimidade tratada com elegância.</h2>
            </div>
          </div>
        </section>

        <ProductGrid
          title="Mais comprados"
          subtitle="Favoritos escolhidos por clientes que valorizam discrição, qualidade e experiência."
          products={bestSellers}
        />

        <EditorialBanner />

        <ProductGrid
          title="Novidades"
          subtitle="Novas escolhas para transformar o cuidado íntimo em um ritual mais sofisticado."
          products={newProducts}
        />

        <HomeCategories categorias={categorias} />

        <Newsletter />
      </main>

      <Footer />
    </>
  );
}