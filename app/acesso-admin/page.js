import Link from "next/link";
import AdminLoginForm from "./AdminLoginForm";

export const metadata = { title: "Acesso administrativo | Virella" };

export default function AcessoAdminPage() {
  return (
    <main className="adminGatePage">
      <section className="adminGateCard">
        <Link href="/" className="adminGateBrand">
          <span>Virella</span>
          <strong>Sexshop</strong>
        </Link>

        <span className="kicker">Área protegida</span>
        <h1>Administração da loja</h1>
        <p>Entre com a senha definida exclusivamente para o painel da Virella.</p>

        <AdminLoginForm />
      </section>
    </main>
  );
}
