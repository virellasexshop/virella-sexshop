import Link from "next/link";
import { getPublicCategories } from "@/modules/categories/category.service";
import { getAdminProducts } from "@/modules/products/product.service";
import { getCategoryMappings, getConnection, getPublishedLinks, getShopeeCategories } from "@/modules/shopee/service";
import { publishProductAction, saveMappingAction, syncProductAction } from "./actions";

export default async function ShopeePage({ searchParams }) {
  const params = await searchParams;
  const connection = await getConnection().catch(() => null);
  const [localCategories, products, mappings, links] = await Promise.all([
    getPublicCategories(), getAdminProducts(), getCategoryMappings().catch(() => []), getPublishedLinks().catch(() => []),
  ]);
  const shopeeCategories = connection ? await getShopeeCategories().catch(() => []) : [];
  const mappingByLocal = new Map(mappings.map(m => [m.categoria_id, m]));
  const linkByProduct = new Map(links.map(l => [l.produto_id, l]));
  const leafCategories = shopeeCategories.filter(c => !c.has_children);

  return <main className="adminShell"><section className="adminContent" style={{maxWidth: 1250, margin: "0 auto"}}>
    <div className="adminTop"><div><span className="kicker">Integração</span><h1>Shopee</h1><p>Conecte a loja, relacione as categorias e publique seus produtos.</p></div><Link className="adminButton" href="/admin/produtos">Voltar aos produtos</Link></div>
    {params?.erro && <p style={{padding:16, background:"#fee2e2", borderRadius:10}}>Erro: {params.erro}</p>}
    <div className="adminTableCard" style={{padding:20, marginBottom:20}}>
      <h2>1. Conexão</h2>
      {connection ? <p>Loja conectada. Shop ID: <strong>{connection.shop_id}</strong></p> : <><p>Autorize o site da Virella a gerenciar os anúncios da sua loja.</p><a className="adminButton" href="/api/shopee/auth/start">Conectar com a Shopee</a></>}
    </div>
    <div className="adminTableCard" style={{padding:20, marginBottom:20}}>
      <h2>2. Categorias</h2>
      {!connection && <p>Conecte a Shopee para carregar as categorias.</p>}
      {connection && leafCategories.length === 0 && <p>Nenhuma categoria carregada. Confira as credenciais e a autorização.</p>}
      {connection && localCategories.map(category => {
        const current = mappingByLocal.get(category.id);
        return <form action={saveMappingAction} key={category.id} style={{display:"grid", gridTemplateColumns:"220px 1fr auto", gap:12, margin:"10px 0", alignItems:"center"}}>
          <input type="hidden" name="categoria_id" value={category.id}/><strong>{category.nome}</strong>
          <select name="shopee_categoria" defaultValue={current ? `${current.shopee_category_id}|${current.shopee_category_name}` : ""} required>
            <option value="">Selecione a categoria correspondente</option>
            {leafCategories.map(item => <option key={item.category_id} value={`${item.category_id}|${item.display_category_name || item.original_category_name}`}>{item.display_category_name || item.original_category_name} ({item.category_id})</option>)}
          </select><button className="adminRowButton">Salvar</button>
        </form>;
      })}
    </div>
    <div className="adminTableCard" style={{padding:20}}><h2>3. Produtos</h2><p>Publique primeiro alguns produtos de teste. Depois sincronize preço e estoque pelo mesmo painel.</p>
      <table className="adminTable"><thead><tr><th>Produto</th><th>Categoria</th><th>Shopee</th><th>Ação</th></tr></thead><tbody>
      {products.map(product => { const link = linkByProduct.get(product.id); const mapped = mappingByLocal.has(product.categoria_id); return <tr key={product.id}><td><strong>{product.nome}</strong></td><td>{product.categorias?.nome || "Sem categoria"}</td><td>{link?.shopee_item_id ? `Publicado: ${link.shopee_item_id}` : link?.ultimo_erro || (mapped ? "Pronto para publicar" : "Mapeie a categoria")}</td><td>{link?.shopee_item_id ? <form action={syncProductAction}><input type="hidden" name="produto_id" value={product.id}/><button className="adminRowButton">Sincronizar</button></form> : <form action={publishProductAction}><input type="hidden" name="produto_id" value={product.id}/><button className="adminRowButton" disabled={!connection || !mapped}>Enviar para Shopee</button></form>}</td></tr>})}
      </tbody></table></div>
  </section></main>;
}
