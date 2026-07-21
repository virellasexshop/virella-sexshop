import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AuthForm from "@/components/auth/AuthForm";

export const metadata = { title: "Criar conta |  Virella Sexshop" };

function safeRedirect(value) {
  const redirect = String(value || "");
  return redirect.startsWith("/") && !redirect.startsWith("//") ? redirect : "";
}

export default async function CadastroPage({ searchParams }) {
  const query = await searchParams;
  const redirectTo = safeRedirect(query?.redirect);
  return (
    <>
      <Header />
      <main className="authPage">
        <section className="authEditorial authEditorialRegister">
          <span className="eyebrow">Cadastro exclusivo</span>
          <h1>Crie sua conta em poucos instantes.</h1>
          <p>Tenha uma jornada personalizada, segura e completamente discreta.</p>
        </section>
        <AuthForm mode="register" redirectTo={redirectTo} />
      </main>
      <Footer />
    </>
  );
}
