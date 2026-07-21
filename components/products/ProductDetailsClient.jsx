"use client";

import { useState } from "react";
import AddToCartButton from "@/components/cart/AddToCartButton";
import styles from "./ProductDetailsClient.module.css";

function money(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function ProductDetailsClient({ product }) {
  const alternatives = (product.produto_variacoes || []).filter(
    (variation) => variation.ativo !== false
  );
  const principal = alternatives.length > 0 && product.opcao_principal_nome
    ? {
        id: null,
        optionKey: "principal",
        principal: true,
        nome: product.opcao_principal_nome,
        imagem_url: product.imagem_principal,
        preco_original: product.preco_original,
        preco_final: product.preco_final,
        em_promocao: product.em_promocao,
        desconto_percentual: product.desconto_percentual,
      }
    : null;
  const options = principal
    ? [principal, ...alternatives.map((variation) => ({
        ...variation,
        optionKey: String(variation.id),
      }))]
    : alternatives.map((variation) => ({
        ...variation,
        optionKey: String(variation.id),
      }));

  const [selectedOptionKey, setSelectedOptionKey] = useState("");
  const selectedOption = options.find((option) => option.optionKey === selectedOptionKey) || null;

  const imageCandidates = [
    product.imagem_principal,
    ...(product.produto_imagens || []).map((image) => image.url),
    ...alternatives.map((variation) => variation.imagem_url),
  ].filter(Boolean);
  const images = [...new Set(imageCandidates)];

  const [activeImage, setActiveImage] = useState(images[0] || "");
  const currentPrice = selectedOption?.preco_final ?? product.preco_final ?? product.preco;
  const originalPrice = selectedOption?.preco_original ?? product.preco_original ?? product.preco;
  const onSale = selectedOption ? selectedOption.em_promocao : product.em_promocao;
  const discount = selectedOption?.desconto_percentual ?? product.desconto_percentual;

  function chooseOption(option) {
    setSelectedOptionKey(option.optionKey);
    setActiveImage(option.imagem_url || product.imagem_principal || images[0] || "");
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

        {options.length > 0 && (
          <div className={styles.variations}>
            <div className={styles.variationHeading}>
              <strong>Escolha uma opção</strong>
            </div>
            <div className={styles.variationGrid}>
              {options.map((option) => (
                <button
                  type="button"
                  key={option.optionKey}
                  className={option.optionKey === selectedOptionKey ? styles.selected : ""}
                  onClick={() => chooseOption(option)}
                >
                  {option.imagem_url && <img src={option.imagem_url} alt="" />}
                  <span>
                    <strong>{option.nome}</strong>
                    <small>{money(option.preco_final ?? currentPrice)}</small>
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <AddToCartButton
          product={product}
          variation={selectedOption}
          disabled={options.length > 0 && !selectedOption}
          disabledLabel="Escolha uma opção"
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
