import { notFound } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ProductDetailsClient from "@/components/products/ProductDetailsClient";
import { getProductBySlug } from "@/modules/products/product.service";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }) {
  const { id } = await params;
  const product = await getProductBySlug(id);
  if (!product || product.ativo === false) notFound();

  return (
    <>
      <Header />
      <ProductDetailsClient product={product} />
      <Footer />
    </>
  );
}
