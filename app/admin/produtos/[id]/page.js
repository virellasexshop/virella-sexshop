import Link from "next/link";
import { notFound } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import ConfirmActionButton from "@/components/admin/ConfirmActionButton";
import { getProductById } from "@/modules/products/product.service";
import {
  addProductImagesAction,
  createVariationAction,
  deleteProductImageAction,
  deleteVariationAction,
  updateVariationAction,
} from "../actions";
import styles from "./produto.module.css";

export const dynamic = "force-dynamic";

export default async function ManageProductPage({ params }) {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) notFound();

  return (
    <main className="adminShell">
      <AdminSidebar />
      <section className="adminContent">
        <div className="adminTop">
          <div>
            <span className="kicker">Produto</span>
            <h1>{product.nome}</h1>
            <p className="adminTopDescription">Gerencie fotos, opções e estoque por variação.</p>
          </div>
          <Link href="/admin/produtos" className="adminButton secondary">Voltar</Link>
        </div>

        <section className={styles.card}>
          <header><div><span>Galeria</span><h2>Fotos adicionais</h2></div></header>
          <div className={styles.gallery}>
            {product.imagem_principal && (
              <figure><img src={product.imagem_principal} alt={product.nome} /><figcaption>Imagem principal</figcaption></figure>
            )}
            {(product.produto_imagens || []).map((image) => (
              <figure key={image.id}>
                <img src={image.url} alt="" />
                <ConfirmActionButton
                  action={deleteProductImageAction}
                  fields={{ imagem_id: image.id, produto_id: product.id }}
                  label="Remover foto"
                  message="Remover esta foto da galeria?"
                  className={styles.deleteLink}
                />
              </figure>
            ))}
          </div>
          <form action={addProductImagesAction} className={styles.addMediaForm}>
            <input type="hidden" name="produto_id" value={product.id} />
            <input type="file" name="imagens" accept="image/png,image/jpeg,image/webp" multiple required />
            <button type="submit" className="adminButton">Adicionar fotos</button>
          </form>
        </section>

        <section className={styles.card}>
          <header><div><span>Opções do produto</span><h2>Variações cadastradas</h2></div></header>
          <div className={styles.variations}>
            {(product.produto_variacoes || []).map((variation) => (
              <article key={variation.id} className={styles.variation}>
                {variation.imagem_url && <img src={variation.imagem_url} alt="" />}
                <form action={updateVariationAction} className={styles.variationForm}>
                  <input type="hidden" name="produto_id" value={product.id} />
                  <input type="hidden" name="variacao_id" value={variation.id} />
                  <label>Nome<input name="nome" defaultValue={variation.nome} required /></label>
                  <label>SKU<input name="sku" defaultValue={variation.sku || ""} /></label>
                  <label>Preço próprio<input name="preco" inputMode="decimal" defaultValue={variation.preco ?? ""} placeholder="Usar preço principal" /></label>
                  <label>Estoque<input name="quantidade" type="number" min="0" defaultValue={variation.quantidade} required /></label>
                  <label>Trocar imagem<input name="imagem" type="file" accept="image/png,image/jpeg,image/webp" /></label>
                  <label className={styles.active}><input name="ativo" type="checkbox" defaultChecked={variation.ativo} /> Ativa</label>
                  <button type="submit" className="adminRowButton">Salvar variação</button>
                </form>
                <ConfirmActionButton
                  action={deleteVariationAction}
                  fields={{ variacao_id: variation.id, produto_id: product.id }}
                  label="Excluir variação"
                  message={`Excluir a variação “${variation.nome}”?`}
                  className={styles.deleteButton}
                />
              </article>
            ))}
            {(product.produto_variacoes || []).length === 0 && (
              <p className={styles.empty}>Este produto ainda não possui variações.</p>
            )}
          </div>
        </section>

        <section className={styles.card}>
          <header><div><span>Nova opção</span><h2>Adicionar variação</h2></div></header>
          <form action={createVariationAction} className={styles.newVariation}>
            <input type="hidden" name="produto_id" value={product.id} />
            <label>Nome<input name="nome" required placeholder="Ex: Morango" /></label>
            <label>SKU<input name="sku" placeholder="VIR-GEL-MOR" /></label>
            <label>Preço próprio<input name="preco" inputMode="decimal" placeholder="Vazio = preço principal" /></label>
            <label>Estoque<input name="quantidade" type="number" min="0" defaultValue="0" required /></label>
            <label>Imagem<input name="imagem" type="file" accept="image/png,image/jpeg,image/webp" /></label>
            <button type="submit" className="adminButton">Adicionar variação</button>
          </form>
        </section>
      </section>
    </main>
  );
}
