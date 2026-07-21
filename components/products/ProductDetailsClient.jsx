"use client";

import { useMemo, useState } from "react";
import AddToCartButton from "@/components/cart/AddToCartButton";
import styles from "./ProductDetailsClient.module.css";

function money(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function ProductDetailsClient({ product }) {
  const variations = (product.produto_variacoes || []).filter((variation) => variation.ativo !== false);
  const [selectedVariationId, setSelectedVariationId] = useState("");

  const selectedVariation = variations.find(
    (variation) => String(variation.id) === selectedVariationId
  ) || null;

  const images = useMemo(() => {
    const candidates = [
      product.imagem_principal,
      ...(product.produto_imagens || []).map((image) => image.url),
      ...variations.map((variation) => variation.imagem_url),
    ].filter(Boolean);
    return [...new Set(candidates)];
  }, [product.imagem_principal, product.produto_imagens, variations]);

  const [activeImage, setActiveImage] = useState(images[0] || "");
  const currentPrice = selectedVariation?.preco_final ?? product.preco_final ?? product.preco;
  const originalPrice = selectedVariation?.preco_original ?? product.preco_original ?? product.preco;
  const onSale = selectedVariation ? selectedVariation.em_promocao : product.em_promocao;
  const discount = selectedVariation?.desconto_percentual ?? product.desconto_percentual;
  const available = selectedVariation
    ? Number(selectedVariation.quantidade || 0)
    : Number(product.quantidade || 0);

  function chooseVariation(variation) {
    setSelectedVariationId(String(variation.id));
    setActiveImage(variation.imagem_url || product.imagem_principal || images[0] || "");
  }

  return (
    <main className={`${styles.page} container`}>
      <section className={styles.gallery}>
        <div className={styles.mainImage}>
          {activeImage ? (
            <img src={activeImage} alt={product.nome} />
          ) : (
            <div className={styles.placeholder}>Virella Sexshop</div>
          )}
        </div>

        {images.length > 1 && (
          <div className={styles.thumbnails} aria-label="Fotos do produto">
            {images.map((image, index) => (
              <button
                type="button"
                key={image}
                className={activeImage === image ? styles.thumbnailActive : ""}
                onClick={() => setActiveImage(image)}
                aria-label={`Ver foto ${index + 1}`}
              >
                <img src={image} alt="" />
              </button>
            ))}
          </div>
        )}
      </section>

      <section className={styles.details}>
        <span className="eyebrow">Curadoria premium</span>
        <h1>{product.nome}</h1>
        <p className={styles.lead}>
          {product.descricao_curta || "Uma escolha sofisticada para transformar seus momentos com conforto e discrição."}
        </p>

        {onSale && <span className={styles.discount}>{discount}% de desconto</span>}
        <div className={styles.price}>{money(currentPrice)}</div>
        {onSale && <span className={styles.oldPrice}>De {money(originalPrice)}</span>}

        {variations.length > 0 && (
          <div className={styles.variations}>
            <div className={styles.variationHeading}>
              <strong>Escolha uma opção</strong>
              {selectedVariation && <span>{available} em estoque</span>}
            </div>
            <div className={styles.variationGrid}>
              {variations.map((variation) => (
                <button
                  type="button"
                  key={variation.id}
                  className={String(variation.id) === selectedVariationId ? styles.selected : ""}
                  onClick={() => chooseVariation(variation)}
                  disabled={Number(variation.quantidade || 0) === 0}
                >
                  {variation.imagem_url && <img src={variation.imagem_url} alt="" />}
                  <span>
                    <strong>{variation.nome}</strong>
                    <small>
                      {Number(variation.quantidade || 0) === 0
                        ? "Esgotado"
                        : money(variation.preco_final ?? currentPrice)}
                    </small>
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <AddToCartButton
          product={product}
          variation={selectedVariation}
          disabled={(variations.length > 0 && !selectedVariation) || available <= 0}
          disabledLabel={available <= 0 && (variations.length === 0 || selectedVariation)
            ? "Produto sem estoque"
            : "Escolha uma variação"}
        />

        <div className={styles.assurances}>
          <div><strong>Embalagem discreta</strong><span>Sem identificação do conteúdo.</span></div>
          <div><strong>Compra protegida</strong><span>Seus dados permanecem seguros.</span></div>
          <div><strong>Curadoria especial</strong><span>Produtos selecionados com cuidado.</span></div>
        </div>

        {product.descricao && (
          <div className={styles.description}>
            <h2>Detalhes</h2>
            <p>{product.descricao}</p>
          </div>
        )}
      </section>
    </main>
  );
}
