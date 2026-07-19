import Link from "next/link";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { countOrders } from "@/modules/orders/order.service";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const orderCount = await countOrders();
  return (
    <main className="adminShell">
      <AdminSidebar />

      <section className="adminContent">
        <div className="adminTop">
          <div>
            <span className="kicker">Painel administrativo</span>
            <h1>Dashboard</h1>
          </div>

          <Link href="/admin/produtos/novo" className="adminButton">
            Novo produto
          </Link>
        </div>

        <div className="adminCards">
          <div className="adminCard">
            <span>Catálogo</span>
            <strong>Virella</strong>
            <p>Cadastre e organize os produtos da loja.</p>
          </div>

          <div className="adminCard">
            <span>Pedidos</span>
            <strong>{orderCount}</strong>
            <p>Pedidos recebidos até agora.</p>
          </div>

          <div className="adminCard">
            <span>Atalhos</span>
            <strong>3</strong>
            <p>Acessos rápidos para administrar a loja.</p>
          </div>
        </div>

        <div className="adminPanel">
          <h2>Ações rápidas</h2>

          <div className="adminActionList">
            <Link href="/admin/produtos/novo">Cadastrar novo produto</Link>
            <Link href="/admin/produtos/importar">Importar vários produtos por planilha</Link>
            <Link href="/admin/produtos">Organizar produtos por categoria</Link>
            <Link href="/admin/categorias">Gerenciar categorias</Link>
            <Link href="/admin/pedidos">Ver pedidos e pagamentos</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
