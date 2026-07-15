import Link from "next/link";

export default function AdminPage() {
  return (
    <main className="adminShell">
      <aside className="adminSidebar">
        <div className="adminBrand">
          <span>Virella</span>
          <strong>Sexshop</strong>
        </div>

        <nav className="adminNav">
          <Link href="/admin">Dashboard</Link>
          <Link href="/admin/produtos">Produtos</Link>
          <Link href="/admin/categorias">Categorias</Link>
          <Link href="/admin/pedidos">Pedidos</Link>
          <Link href="/admin/clientes">Clientes</Link>
          <Link href="/admin/configuracoes">Configurações</Link>
        </nav>
      </aside>

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
            <span>Produtos ativos</span>
            <strong>4</strong>
            <p>Produtos disponíveis na loja.</p>
          </div>

          <div className="adminCard">
            <span>Pedidos</span>
            <strong>0</strong>
            <p>Pedidos recebidos até agora.</p>
          </div>

          <div className="adminCard">
            <span>Receita</span>
            <strong>R$ 0,00</strong>
            <p>Total vendido no período.</p>
          </div>
        </div>

        <div className="adminPanel">
          <h2>Próximas ações</h2>

          <div className="adminActionList">
            <Link href="/admin/produtos/novo">Cadastrar primeiro produto real</Link>
            <Link href="/admin/categorias">Organizar categorias</Link>
            <Link href="/admin/pedidos">Configurar pedidos</Link>
          </div>
        </div>
      </section>
    </main>
  );
}