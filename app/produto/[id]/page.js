import { notFound } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AddToCartButton from "@/components/cart/AddToCartButton";
import { getProductBySlug } from "@/modules/products/product.service";

function money(value) { return Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }

export default async function ProductPage({ params }) {
  const { id } = await params;
  const product = await getProductBySlug(id);
  if (!product) notFound();
  const price = product.preco_promocional || product.preco;
  return (
    <>
      <Header />
      <main className="productPage container">
        <div className="productGalleryMain">
          {product.imagem_principal ? <img src={product.imagem_principal} alt={product.nome} /> : <div className="productPlaceholder">Virella Sexshop</div>}
        </div>
        <section className="productDetails">
          <span className="eyebrow">Curadoria premium</span>
          <h1>{product.nome}</h1>
          <p className="productLead">{product.descricao_curta || "Uma escolha sofisticada para transformar seus momentos com conforto e discrição."}</p>
          <div className="productPrice">{money(price)}</div>
          {product.preco_promocional && <span className="oldPrice">{money(product.preco)}</span>}
          <AddToCartButton product={product} />
          <div className="productAssurances">
            <div><strong>Embalagem discreta</strong><span>Sem identificação do conteúdo.</span></div>
            <div><strong>Compra protegida</strong><span>Seus dados permanecem seguros.</span></div>
            <div><strong>Curadoria especial</strong><span>Produtos selecionados com cuidado.</span></div>
          </div>
          {product.descricao && <div className="productDescription"><h2>Detalhes</h2><p>{product.descricao}</p></div>}
        </section>
      </main>
      <Footer />
    </>
  );
}
