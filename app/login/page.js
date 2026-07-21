import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AuthForm from "@/components/auth/AuthForm";

export const metadata = { title: "Entrar | Virella Sexshop" };

function safeRedirect(value) {
  const redirect = String(value || "");
  return redirect.startsWith("/") && !redirect.startsWith("//") ? redirect : "";
}

export default async function LoginPage({ searchParams }) {
  const query = await searchParams;
  const redirectTo = safeRedirect(query?.redirect);
  return (
    <>
      <Header />
      <main className="authPage">
        <section className="authEditorial">
          <span className="eyebrow">Área reservada</span>
          <h1>Sua experiência, com ainda mais privacidade.</h1>
          <p>Acompanhe pedidos, salve seus dados e conclua compras com mais rapidez.</p>
          <div className="authBenefits">
            <span>01 · Dados protegidos</span>
            <span>02 · Histórico de pedidos</span>
            <span>03 · Compra mais rápida</span>
          </div>
        </section>
        <AuthForm mode="login" redirectTo={redirectTo} />
      </main>
      <Footer />
    </>
  );
}
