import AdminSidebar from "@/components/admin/AdminSidebar";
import { getAdminProducts } from "@/modules/products/product.service";
import { getPromotionSettings } from "@/modules/promotions/promotion.service";
import {
  disableAllProductPromotionsAction,
  updateGlobalPromotionAction,
  updateProductPromotionAction,
} from "./actions";

export const dynamic = "force-dynamic";

function money(value) {
  return Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function AdminPromocoesPage({ searchParams }) {
  const [products, settings] = await Promise.all([
    getAdminProducts(),
    getPromotionSettings(),
  ]);
  const query = await searchParams;
  const activePromotions = products.filter((product) => product.promocao).length;

  return (
    <main className="adminShell">
      <AdminSidebar />

      <section className="adminContent">
        <div className="adminTop">
          <div>
            <span className="kicker">Controle de preços</span>
            <h1>Promoções</h1>
          </div>
        </div>

        {query?.sucesso && <p className="adminFeedback success">{query.sucesso}</p>}
        {query?.erro && <p className="adminFeedback error">{query.erro}</p>}

        <section className="promotionGlobalPanel">
          <div className="promotionGlobalCopy">
            <span>Campanha geral</span>
            <h2>Desconto no site inteiro</h2>
            <p>O preço original nunca é alterado. Desligue a campanha e todos os produtos voltam ao valor normal.</p>
          </div>

          <form action={updateGlobalPromotionAction} className="promotionGlobalForm">
            <label>
              Percentual de desconto
              <div><input name="percentual" type="number" min="0" max="99" step="0.01" defaultValue={Number(settings.desconto_global_percentual || 0)} /><span>% OFF</span></div>
            </label>
            <label className="promotionSwitch">
              <input name="ativa" type="checkbox" defaultChecked={settings.promocao_global_ativa} />
              <span aria-hidden="true" />
              Campanha ativa
            </label>
            <button type="submit" className="adminButton">Salvar campanha</button>
          </form>
        </section>

        <div className="promotionSummary">
          <div><span>Campanha global</span><strong>{settings.promocao_global_ativa ? `${Number(settings.desconto_global_percentual)}% OFF` : "Desligada"}</strong></div>
          <div><span>Promoções individuais</span><strong>{activePromotions}</strong></div>
          <form action={disableAllProductPromotionsAction}>
            <button type="submit" className="adminButton secondary">Encerrar todas as individuais</button>
          </form>
        </div>

        <div className="promotionProductsHeader">
          <div><span>Produtos</span><h2>Promoções individuais</h2></div>
          <p>Informe um valor menor que o preço original e ative a promoção.</p>
        </div>

        <div className="promotionProductList">
          {products.map((product) => (
            <form action={updateProductPromotionAction} className="promotionProductRow" key={product.id}>
              <input type="hidden" name="id" value={product.id} />
              <input type="hidden" name="preco_original" value={product.preco} />

              <div className="promotionProductIdentity">
                {product.imagem_principal ? <img src={product.imagem_principal} alt="" /> : <span>V</span>}
                <div><strong>{product.nome}</strong><small>{product.sku || "Sem SKU"}</small></div>
              </div>

              <div className="promotionOriginalPrice"><span>Preço original</span><strong>{money(product.preco)}</strong></div>

              <label className="promotionPriceInput">
                Preço promocional
                <input name="preco_promocional" inputMode="decimal" defaultValue={product.preco_promocional || ""} placeholder="0,00" />
              </label>

              <label className="promotionSwitch compact">
                <input name="promocao" type="checkbox" defaultChecked={product.promocao} />
                <span aria-hidden="true" />
                {product.promocao ? "Ativa" : "Inativa"}
              </label>

              <button type="submit" className="adminButton secondary">Salvar</button>
            </form>
          ))}
        </div>
      </section>
    </main>
  );
}
