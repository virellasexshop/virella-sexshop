import Link from "next/link";
import { createProductAction } from "../actions";
import ImageUploader from "@/components/admin/ImageUploader";

export default function NovoProdutoPage() {
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
            <h1>Novo produto</h1>
          </div>

          <Link href="/admin/produtos" className="adminButton secondary">
            Voltar
          </Link>
        </div>

        <form action={createProductAction} className="productForm">
          <div className="formCard">
            <h2>Informações básicas</h2>

            <label>
              Nome do produto
              <input name="nome" required placeholder="Ex: Gel sensorial premium" />
            </label>

            <label>
              Slug
              <input name="slug" placeholder="gel-sensorial-premium" />
            </label>

            <label>
              Descrição curta
              <textarea name="descricao_curta" rows="3" />
            </label>

            <label>
              Descrição completa
              <textarea name="descricao" rows="6" />
            </label>
          </div>

          <div className="formCard">
            <h2>Imagem do produto</h2>
            <ImageUploader name="imagem_principal" />
          </div>

          <div className="formCard">
            <h2>Preços</h2>

            <div className="formGrid">
              <label>
                Preço
                <input name="preco" required placeholder="99.90" />
              </label>

              <label>
                Preço promocional
                <input name="preco_promocional" placeholder="79.90" />
              </label>
            </div>
          </div>

          <div className="formCard">
            <h2>Estoque</h2>

            <div className="formGrid">
              <label>
                Quantidade
                <input name="quantidade" type="number" defaultValue="0" />
              </label>

              <label>
                SKU
                <input name="sku" placeholder="PD-001" />
              </label>

              <label>
                Código de barras
                <input name="codigo_barras" />
              </label>
            </div>
          </div>

          <div className="formCard">
            <h2>SEO</h2>

            <label>
              Meta title
              <input name="meta_title" />
            </label>

            <label>
              Meta description
              <textarea name="meta_description" rows="3" />
            </label>
          </div>

          <div className="formCard">
            <h2>Opções</h2>

            <div className="checkboxGrid">
              <label><input type="checkbox" name="ativo" defaultChecked /> Ativo</label>
              <label><input type="checkbox" name="destaque" /> Destaque</label>
              <label><input type="checkbox" name="promocao" /> Promoção</label>
              <label><input type="checkbox" name="novo" /> Novo</label>
              <label><input type="checkbox" name="mais_vendido" /> Mais vendido</label>
            </div>
          </div>

          <div className="formActions">
            <Link href="/admin/produtos" className="adminButton secondary">
              Cancelar
            </Link>

            <button type="submit" className="adminButton">
              Salvar produto
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}