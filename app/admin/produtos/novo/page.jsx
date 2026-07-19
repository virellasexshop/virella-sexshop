import Link from "next/link";
import { createProductAction } from "../actions";
import ImageUploader from "@/components/admin/ImageUploader";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { getAdminCategories } from "@/modules/categories/category.service";

export const dynamic = "force-dynamic";

export default async function NovoProdutoPage() {
  const categorias = await getAdminCategories();

  return (
    <main className="adminShell">
      <AdminSidebar />

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
              Slug (opcional)
              <input name="slug" placeholder="gel-sensorial-premium" />
            </label>

            <label>
              Categoria
              <select name="categoria_id" required defaultValue="">
                <option value="" disabled>Selecione uma categoria</option>
                {categorias.map((categoria) => (
                  <option key={categoria.id} value={categoria.id}>
                    {categoria.nome}{categoria.ativo === false ? " — inativa" : ""}
                  </option>
                ))}
              </select>
            </label>

            {categorias.length === 0 && (
              <p className="adminFormNotice">
                Crie uma categoria antes de cadastrar o produto. 
                <Link href="/admin/categorias">Criar categoria</Link>
              </p>
            )}

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
                <input name="preco" required inputMode="decimal" placeholder="99,90" />
              </label>
              <label>
                Preço promocional
                <input name="preco_promocional" inputMode="decimal" placeholder="79,90" />
              </label>
            </div>
          </div>

          <div className="formCard">
            <h2>Estoque</h2>
            <div className="formGrid">
              <label>
                Quantidade
                <input name="quantidade" type="number" min="0" defaultValue="0" />
              </label>
              <label>
                SKU
                <input name="sku" placeholder="VIR-001" />
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
              Título para buscadores
              <input name="meta_title" />
            </label>
            <label>
              Descrição para buscadores
              <textarea name="meta_description" rows="3" />
            </label>
          </div>

          <div className="formCard">
            <h2>Exibição</h2>
            <div className="checkboxGrid">
              <label><input type="checkbox" name="ativo" defaultChecked /> Ativo</label>
              <label><input type="checkbox" name="destaque" /> Destaque</label>
              <label><input type="checkbox" name="promocao" /> Promoção</label>
              <label><input type="checkbox" name="novo" /> Novo</label>
              <label><input type="checkbox" name="mais_vendido" /> Mais vendido</label>
            </div>
          </div>

          <div className="formActions">
            <Link href="/admin/produtos" className="adminButton secondary">Cancelar</Link>
            <button type="submit" className="adminButton" disabled={categorias.length === 0}>
              Salvar produto
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
