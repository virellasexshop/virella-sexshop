import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CheckoutClient from "@/components/checkout/CheckoutClient";

export const metadata = { title: "Finalizar compra | Virella Sexshop" };

export default function CheckoutPage() {
  return (
    <>
      <Header />
      <main className="container">
        <CheckoutClient />
      </main>
      <Footer />
    </>
  );
}
