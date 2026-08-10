import AdminSidebar from "@/components/admin/AdminSidebar";
import { getAdminProducts } from "@/modules/products/product.service";
import { getMercadoLivreAccount } from "@/lib/mercado-livre/token-store";
import { getMercadoLivreMappings } from "@/lib/mercado-livre/products";
import MercadoLivreManager from "./MercadoLivreManager";
import styles from "./mercado-livre.module.css";

export const dynamic = "force-dynamic";

function toClientProduct(product, mapping) {
  return {
    id: product.id,
    nome: product.nome,
    imagem_principal: product.imagem_principal || null,
    preco: Number(product.preco_promocional || product.preco || 0),
    sku: product.sku || null,
    codigo_barras: product.codigo_barras || null,
    ativo: product.ativo !== false,
    variacoes: Array.isArray(product.produto_variacoes)
      ? product.produto_variacoes.filter((item) => item.ativo !== false).length
      : 0,
    mapping: mapping
      ? {
          ml_item_id: mapping.ml_item_id,
          ml_permalink: mapping.ml_permalink,
          category_id: mapping.category_id,
          listing_type_id: mapping.listing_type_id,
          condition: mapping.condition,
          ml_title: mapping.ml_title,
          ml_price: mapping.ml_price ? Number(mapping.ml_price) : null,
          available_quantity: mapping.available_quantity,
          variation_attribute_id: mapping.variation_attribute_id,
          status: mapping.status,
          last_error: mapping.last_error,
          sincronizado_em: mapping.sincronizado_em,
        }
      : null,
  };
}

export default async function MercadoLivreAdminPage({ searchParams }) {
  const params = await searchParams;
  const [products, account] = await Promise.all([
    getAdminProducts(),
    getMercadoLivreAccount(),
  ]);
  const mappings = await getMercadoLivreMappings(products.map((product) => product.id));
  const byProduct = new Map(mappings.map((mapping) => [String(mapping.produto_id), mapping]));
  const clientProducts = products.map((product) =>
    toClientProduct(product, byProduct.get(String(product.id)))
  );

  return (
    <main className="adminShell">
      <AdminSidebar />
      <section className="adminContent">
        <div className="adminTop">
          <div>
            <span className="kicker">Integrações</span>
            <h1>Mercado Livre</h1>
            <p className="adminTopDescription">
              Publique produtos da Virella e mantenha preço e disponibilidade sincronizados.
            </p>
          </div>
        </div>

        {params?.erro && <div className={styles.errorBox}>{String(params.erro)}</div>}
        {params?.conectado === "1" && (
          <div className={styles.successBox}>Conta do Mercado Livre conectada com sucesso.</div>
        )}

        <MercadoLivreManager
          initialProducts={clientProducts}
          account={
            account
              ? {
                  seller_id: account.seller_id,
                  nickname: account.nickname,
                  token_expires_at: account.token_expires_at,
                }
              : null
          }
        />
      </section>
    </main>
  );
}
