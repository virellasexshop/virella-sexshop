import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AuthForm from "@/components/auth/AuthForm";

export const metadata = { title: "Criar conta |  Virella Sexshop" };

export default function CadastroPage() {
  return (
    <>
      <Header />
      <main className="authPage">
        <section className="authEditorial authEditorialRegister">
          <span className="eyebrow">Cadastro exclusivo</span>
          <h1>Crie sua conta em poucos instantes.</h1>
          <p>Tenha uma jornada personalizada, segura e completamente discreta.</p>
        </section>
        <AuthForm mode="register" />
      </main>
      <Footer />
    </>
  );
}
