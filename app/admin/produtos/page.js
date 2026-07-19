import Link from "next/link";
import { getAdminProducts } from "@/modules/products/product.service";
import { getAdminCategories } from "@/modules/categories/category.service";
import { updateProductCategoryAction } from "./actions";
import AdminSidebar from "@/components/admin/AdminSidebar";

export const dynamic = "force-dynamic";

function formatPrice(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default async function AdminProdutosPage() {
  const [produtos, categorias] = await Promise.all([
    getAdminProducts(),
    getAdminCategories(),
  ]);

  return (
    <main className="adminShell">
      <AdminSidebar />

      <section className="adminContent">
        <div className="adminTop">
          <div>
            <span className="kicker">Catálogo</span>
            <h1>Produtos</h1>
          </div>

          <div className="adminTopActions">
            <Link href="/admin/produtos/importar" className="adminButton secondary">
              Importar planilha
            </Link>
            <Link href="/admin/produtos/novo" className="adminButton">
              Novo produto
            </Link>
          </div>
        </div>

        <div className="adminTableCard">
          <table className="adminTable">
            <thead>
              <tr>
                <th>Produto</th>
                <th>Categoria</th>
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
                    <form
                      action={updateProductCategoryAction}
                      className="adminCategoryForm"
                    >
                      <input type="hidden" name="produto_id" value={produto.id} />

                      <select
                        name="categoria_id"
                        defaultValue={produto.categoria_id || ""}
                        aria-label={`Categoria de ${produto.nome}`}
                      >
                        <option value="">Sem categoria</option>
                        {categorias.map((categoria) => (
                          <option key={categoria.id} value={categoria.id}>
                            {categoria.nome}
                            {categoria.ativo === false ? " — inativa" : ""}
                          </option>
                        ))}
                      </select>

                      <button type="submit">Salvar</button>
                    </form>
                  </td>

                  <td>
                    <strong>{formatPrice(produto.preco)}</strong>
                    {produto.promocao && produto.preco_promocional && (
                      <span>Promo: {formatPrice(produto.preco_promocional)}</span>
                    )}
                  </td>
                  <td>{produto.quantidade}</td>

                  <td>
                    <span className={produto.ativo ? "status active" : "status"}>
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
                  <td colSpan="6">Nenhum produto cadastrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
