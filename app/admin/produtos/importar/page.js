import Link from "next/link";
import AdminSidebar from "@/components/admin/AdminSidebar";
import ImportProductsForm from "./ImportProductsForm";

export const dynamic = "force-dynamic";

export default function ImportarProdutosPage() {
  return (
    <main className="adminShell">
      <AdminSidebar />

      <section className="adminContent">
        <div className="adminTop">
          <div>
            <span className="kicker">Cadastro em massa</span>
            <h1>Importar produtos</h1>
          </div>

          <div className="adminTopActions">
            <a href="/modelo-importacao-produtos.csv" download className="adminButton secondary">
              Baixar modelo
            </a>
            <Link href="/admin/produtos" className="adminButton secondary">Voltar</Link>
          </div>
        </div>

        <div className="adminImportIntro">
          <span>Planilha inteligente</span>
          <h2>Cadastre centenas de produtos em poucos minutos.</h2>
          <p>
            Preencha o modelo, salve em CSV e envie abaixo. A importação reconhece
            arquivos separados por vírgula ou ponto e vírgula, inclusive os gerados pelo Excel.
          </p>
        </div>

        <ImportProductsForm />
      </section>
    </main>
  );
}
