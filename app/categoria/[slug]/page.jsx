import { notFound } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ProductCard from "@/components/products/ProductCard";
import { getProductsByCategorySlug } from "@/modules/products/product.service";

export default async function CategoryPage({ params }) {
  const { slug } = await params;
  const { categoria, produtos } = await getProductsByCategorySlug(slug);
  if (!categoria) notFound();
  return <><Header /><main className="categoryPage"><section className="categoryHero"><div className="container"><span className="eyebrow">Coleção selecionada</span><h1>{categoria.nome}</h1><p>{categoria.descricao || "Descubra uma seleção sofisticada, criada para experiências únicas."}</p></div></section><section className="container categoryProducts"><div className="catalogResultLine"><span>{produtos.length} produtos</span><span>Curadoria exclusiva</span></div>{produtos.length ? <div className="catalogGrid">{produtos.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <div className="emptyState"><span>Em breve</span><h2>Estamos preparando esta coleção.</h2><a href="/catalogo">Ver catálogo completo</a></div>}</section></main><Footer /></>;
}
