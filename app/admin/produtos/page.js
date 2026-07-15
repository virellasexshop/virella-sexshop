import Link from "next/link";
import { getAdminProducts } from "@/modules/products/product.service";

function formatPrice(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default async function AdminProdutosPage() {
  const produtos = await getAdminProducts();

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
            <span className="kicker">Catálogo</span>
            <h1>Produtos</h1>
          </div>

          <Link href="/admin/produtos/novo" className="adminButton">
            Novo produto
          </Link>
        </div>

        <div className="adminTableCard">
          <table className="adminTable">
            <thead>
              <tr>
                <th>Produto</th>
                <th>Preço</th>
                <th>Estoque</th>
                <th>Status</th>
                <th>Vitrine</th>
              </tr>
            </thead>

            <tbody>
              {produtos.map((produto) => (
                <tr key={produto.id}>
                  <td>
                    <div className="adminProductCell">
                      {produto.imagem_principal ? (
                        <img
                          src={produto.imagem_principal}
                          alt={produto.nome}
                        />
                      ) : (
                        <div className="adminProductPlaceholder">
                          Sem foto
                        </div>
                      )}

                      <div>
                        <strong>{produto.nome}</strong>
                        <span>{produto.slug}</span>
                      </div>
                    </div>
                  </td>

                  <td>
                    {formatPrice(
                      produto.preco_promocional || produto.preco
                    )}
                  </td>

                  <td>{produto.quantidade}</td>

                  <td>
                    <span
                      className={
                        produto.ativo ? "status active" : "status"
                      }
                    >
                      {produto.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </td>

                  <td>
                    <div className="adminTags">
                      {produto.mais_vendido && <span>Mais vendido</span>}
                      {produto.novo && <span>Novo</span>}
                      {produto.destaque && <span>Destaque</span>}
                      {produto.promocao && <span>Promoção</span>}
                    </div>
                  </td>
                </tr>
              ))}

              {produtos.length === 0 && (
                <tr>
                  <td colSpan="5">Nenhum produto cadastrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}