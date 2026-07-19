import Link from "next/link";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { getAdminCategories } from "@/modules/categories/category.service";
import { createCategoryAction, updateCategoryAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminCategoriasPage({ searchParams }) {
  const categorias = await getAdminCategories();
  const query = await searchParams;

  return (
    <main className="adminShell">
      <AdminSidebar />

      <section className="adminContent">
        <div className="adminTop">
          <div>
            <span className="kicker">Organização do catálogo</span>
            <h1>Categorias</h1>
          </div>

          <Link href="/admin/produtos/importar" className="adminButton secondary">
            Importar produtos
          </Link>
        </div>

        {query?.sucesso && <p className="adminFeedback success">{query.sucesso}</p>}
        {query?.erro && <p className="adminFeedback error">{query.erro}</p>}

        <form action={createCategoryAction} className="adminCreateCategory">
          <div className="adminSectionHeading">
            <div>
              <span>Nova coleção</span>
              <h2>Criar categoria</h2>
            </div>
            <p>Ela ficará disponível imediatamente no cadastro e na importação de produtos.</p>
          </div>

          <div className="adminCategoryFields">
            <label>
              Nome
              <input name="nome" required placeholder="Ex: Cosméticos sensoriais" />
            </label>
            <label>
              Endereço (opcional)
              <input name="slug" placeholder="cosmeticos-sensoriais" />
            </label>
            <label className="wide">
              Descrição
              <textarea name="descricao" rows="3" placeholder="Uma descrição curta para a página da coleção." />
            </label>
            <label className="wide">
              URL da imagem
              <input name="imagem_url" type="url" placeholder="https://..." />
            </label>
            <label>
              Ordem
              <input name="ordem" type="number" min="0" placeholder="Automática" />
            </label>
            <label className="adminCheckField">
              <input name="ativo" type="checkbox" defaultChecked />
              Categoria ativa
            </label>
          </div>

          <button type="submit" className="adminButton">Criar categoria</button>
        </form>

        <div className="adminCategoryListHeader">
          <span>{categorias.length} categorias</span>
          <p>Edite os dados e clique em salvar.</p>
        </div>

        <div className="adminCategoryCards">
          {categorias.map((categoria) => (
            <form action={updateCategoryAction} className="adminCategoryEditCard" key={categoria.id}>
              <input type="hidden" name="id" value={categoria.id} />

              <div className="adminCategoryCardTop">
                <span>{String(Number(categoria.ordem) || 0).padStart(2, "0")}</span>
                <strong>{categoria.ativo ? "Ativa" : "Inativa"}</strong>
              </div>

              <label>
                Nome
                <input name="nome" required defaultValue={categoria.nome} />
              </label>
              <label>
                Endereço
                <input name="slug" required defaultValue={categoria.slug} />
              </label>
              <label>
                Descrição
                <textarea name="descricao" rows="3" defaultValue={categoria.descricao || ""} />
              </label>
              <label>
                URL da imagem
                <input name="imagem_url" type="url" defaultValue={categoria.imagem_url || ""} />
              </label>

              <div className="adminCategoryCardBottom">
                <label>
                  Ordem
                  <input name="ordem" type="number" min="0" defaultValue={categoria.ordem || 0} />
                </label>
                <label className="adminCheckField">
                  <input name="ativo" type="checkbox" defaultChecked={categoria.ativo} />
                  Ativa
                </label>
                <button type="submit" className="adminButton secondary">Salvar</button>
              </div>
            </form>
          ))}

          {categorias.length === 0 && (
            <div className="adminEmptyPanel">
              <strong>Nenhuma categoria criada.</strong>
              <p>Use o formulário acima para criar a primeira coleção.</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
