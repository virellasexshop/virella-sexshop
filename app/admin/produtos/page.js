import Link from "next/link";
import ProductDeleteButton from "@/components/admin/ProductDeleteButton";
import { getPublicCategories } from "@/modules/categories/category.service";
import { getAdminProducts } from "@/modules/products/product.service";
import {
  toggleProductStatusAction,
  updateProductCategoryAction,
  updateProductStockAction,
} from "./actions";
import "./estoque.css";

function formatPrice(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default async function AdminProdutosPage() {
  const [produtos, categorias] = await Promise.all([
    getAdminProducts(),
    getPublicCategories(),
  ]);

  const totalEstoque = produtos.reduce(
    (total, produto) => total + Number(produto.quantidade || 0),
    0
  );
  const semEstoque = produtos.filter(
    (produto) => Number(produto.quantidade || 0) === 0
  ).length;

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
            <span className="kicker">Catálogo e estoque</span>
            <h1>Produtos</h1>
            <p className="adminTopDescription">
              Atualize quantidades, organize categorias ou retire itens da loja.
            </p>
          </div>

          <Link href="/admin/produtos/novo" className="adminButton">
            Novo produto
          </Link>
        </div>

        <div className="adminInventorySummary">
          <div>
            <span>Produtos cadastrados</span>
            <strong>{produtos.length}</strong>
          </div>
          <div>
            <span>Unidades em estoque</span>
            <strong>{totalEstoque}</strong>
          </div>
          <div>
            <span>Sem estoque</span>
            <strong>{semEstoque}</strong>
          </div>
        </div>

        <div className="adminTableCard adminInventoryTableCard">
          <table className="adminTable adminInventoryTable">
            <thead>
              <tr>
                <th>Produto</th>
                <th>Categoria</th>
                <th>Preço</th>
                <th>Estoque</th>
                <th>Status</th>
                <th>Vitrine</th>
                <th>Ações</th>
              </tr>
            </thead>

            <tbody>
              {produtos.map((produto) => (
                <tr key={produto.id}>
                  <td>
                    <div className="adminProductCell">
                      {produto.imagem_principal ? (
                        <img src={produto.imagem_principal} alt={produto.nome} />
                      ) : (
                        <div className="adminProductPlaceholder">Sem foto</div>
                      )}

                      <div>
                        <strong>{produto.nome}</strong>
                        <span>{produto.slug}</span>
                      </div>
                    </div>
                  </td>

                  <td>
                    <form action={updateProductCategoryAction} className="adminInlineForm">
                      <input type="hidden" name="produto_id" value={produto.id} />
                      <select name="categoria_id" defaultValue={produto.categoria_id || ""}>
                        <option value="">Sem categoria</option>
                        {categorias.map((categoria) => (
                          <option key={categoria.id} value={categoria.id}>
                            {categoria.nome}
                          </option>
                        ))}
                      </select>
                      <button type="submit" className="adminRowButton">Salvar</button>
                    </form>
                  </td>

                  <td className="adminPriceCell">
                    {formatPrice(produto.preco_promocional || produto.preco)}
                  </td>

                  <td>
                    <form action={updateProductStockAction} className="adminStockForm">
                      <input type="hidden" name="produto_id" value={produto.id} />
                      <input
                        type="number"
                        name="quantidade"
                        min="0"
                        step="1"
                        required
                        defaultValue={Number(produto.quantidade || 0)}
                        aria-label={`Estoque de ${produto.nome}`}
                      />
                      <button type="submit" className="adminRowButton">Salvar</button>
                    </form>
                    {Number(produto.quantidade || 0) === 0 && (
                      <span className="adminStockWarning">Sem estoque</span>
                    )}
                  </td>

                  <td>
                    <form action={toggleProductStatusAction}>
                      <input type="hidden" name="produto_id" value={produto.id} />
                      <input type="hidden" name="ativo" value={String(Boolean(produto.ativo))} />
                      <button
                        type="submit"
                        className={produto.ativo ? "status active statusButton" : "status statusButton"}
                        title={produto.ativo ? "Clique para desativar" : "Clique para ativar"}
                      >
                        {produto.ativo ? "Ativo" : "Inativo"}
                      </button>
                    </form>
                  </td>

                  <td>
                    <div className="adminTags">
                      {produto.mais_vendido && <span>Mais vendido</span>}
                      {produto.novo && <span>Novo</span>}
                      {produto.destaque && <span>Destaque</span>}
                      {produto.promocao && <span>Promoção</span>}
                    </div>
                  </td>

                  <td>
                    <ProductDeleteButton productId={produto.id} productName={produto.nome} />
                  </td>
                </tr>
              ))}

              {produtos.length === 0 && (
                <tr>
                  <td colSpan="7" className="adminEmptyCell">
                    Nenhum produto cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
