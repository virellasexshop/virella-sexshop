import Link from "next/link";
import { logoutAdminAction } from "@/app/acesso-admin/actions";

export default function AdminSidebar() {
  return (
    <aside className="adminSidebar">
      <div className="adminBrand">
        <span>Virella</span>
        <strong>Sexshop</strong>
      </div>

      <nav className="adminNav">
        <Link href="/admin">Dashboard</Link>
        <Link href="/admin/produtos">Produtos</Link>
        <Link href="/admin/produtos/novo">Novo produto</Link>
        <Link href="/admin/produtos/importar">Importar planilha</Link>
        <Link href="/admin/categorias">Categorias</Link>
        <Link href="/admin/promocoes">Promoções</Link>
        <Link href="/admin/pedidos">Pedidos</Link>
      </nav>

      <Link href="/" className="adminStoreLink">
        Ver loja <span aria-hidden="true">↗</span>
      </Link>

      <form action={logoutAdminAction}>
        <button type="submit" className="adminLogoutButton">Sair do painel</button>
      </form>
    </aside>
  );
}
