import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ProductGrid from "@/components/products/ProductGrid";
import EditorialBanner from "@/components/home/EditorialBanner";
import HomeBrandVisual from "@/components/home/HomeBrandVisual";
import HomeCategories from "@/components/home/HomeCategories";
import Newsletter from "@/components/home/Newsletter";
import BenefitsStrip from "@/components/home/BenefitsStrip";
import HomeReviews from "@/components/home/HomeReviews";
import TrustSection from "@/components/home/TrustSection";
import { getPublicCategories } from "@/modules/categories/category.service";
import { getLatestReviews } from "@/modules/reviews/review.service";
import homeStyles from "@/components/home/HomeTrust.module.css";

import {
  getBestSellerProducts,
  getNewProducts,
} from "@/modules/products/product.service";

export default async function Home() {
  const bestSellers = await getBestSellerProducts();
  const newProducts = await getNewProducts();
  const categorias = await getPublicCategories();
  const reviews = await getLatestReviews();
  return (
    <>
      <Header />

      <main>
        <section className="homeHero">
          <div className="container homeHeroGrid">
            <div className="homeHeroText">
              <span className="kicker">Boutique íntima premium</span>

              <h1>Prazer, cuidado e discrição em cada escolha.</h1>

              <p>
                Produtos íntimos originais, pagamento seguro e embalagem
                totalmente neutra. Da escolha à entrega, sua privacidade vem primeiro.
              </p>

              <div className="heroButtons">
                <a href="/catalogo" className="btn">
                  Explorar coleção
                </a>

                <a href="/catalogo?categoria=novidades" className="btn btnGhost">
                  Ver novidades
                </a>
              </div>

              <div className={homeStyles.heroTrustLine} aria-label="Diferenciais da Virella">
                <span>Compra protegida</span>
                <span>Envio para todo o Brasil</span>
                <span>Atendimento reservado</span>
              </div>
            </div>

            <HomeBrandVisual />
          </div>
        </section>

        <BenefitsStrip />

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

        <HomeReviews reviews={reviews} />

        <TrustSection />

        <Newsletter />
      </main>

      <Footer />
    </>
  );
}
