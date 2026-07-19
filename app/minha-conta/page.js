import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AccountClient from "@/components/account/AccountClient";

export const metadata = { title: "Minha conta | Virella Sexshop" };

export default function MinhaContaPage() {
  return (
    <>
      <Header />
      <main className="accountPage container">
        <span className="eyebrow">Área do cliente</span>
        <h1>Minha conta</h1>
        <AccountClient />
      </main>
      <Footer />
    </>
  );
}