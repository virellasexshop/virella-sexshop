"use client";

import { useMemo, useState } from "react";
import styles from "./ProductOptionsManager.module.css";

function emptyVariation() {
  return {
    key: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    nome: "",
    sku: "",
    preco: "",
    quantidade: "0",
  };
}

export default function ProductOptionsManager() {
  const [additionalImages, setAdditionalImages] = useState([]);
  const [hasVariations, setHasVariations] = useState(false);
  const [variations, setVariations] = useState([]);

  const variationsJson = useMemo(
    () => JSON.stringify(hasVariations ? variations.map(({ key, ...variation }) => variation) : []),
    [hasVariations, variations]
  );

  function selectAdditionalImages(event) {
    const files = Array.from(event.target.files || []);
    setAdditionalImages(files.map((file) => ({
      name: file.name,
      url: URL.createObjectURL(file),
    })));
  }

  function toggleVariations(event) {
    const checked = event.target.checked;
    setHasVariations(checked);
    if (checked && variations.length === 0) setVariations([emptyVariation()]);
  }

  function updateVariation(index, field, value) {
    setVariations((current) => current.map((variation, currentIndex) => (
      currentIndex === index ? { ...variation, [field]: value } : variation
    )));
  }

  function removeVariation(index) {
    setVariations((current) => current.filter((_, currentIndex) => currentIndex !== index));
  }

  return (
    <>
      <div className="formCard">
        <div className={styles.heading}>
          <div>
            <h2>Galeria do produto</h2>
            <p>Adicione outros ângulos além da imagem principal.</p>
          </div>
          <span>Opcional</span>
        </div>

        <label className={styles.filePicker}>
          <input
            type="file"
            name="imagens_adicionais"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            multiple
            onChange={selectAdditionalImages}
          />
          <strong>Selecionar várias fotos</strong>
          <small>JPG, PNG ou WEBP. Mantenha o envio total abaixo de 3,5 MB.</small>
        </label>

        {additionalImages.length > 0 && (
          <div className={styles.previews}>
            {additionalImages.map((image) => (
              <figure key={`${image.name}-${image.url}`}>
                <img src={image.url} alt="Prévia adicional" />
                <figcaption>{image.name}</figcaption>
              </figure>
            ))}
          </div>
        )}
      </div>

      <div className="formCard">
        <div className={styles.heading}>
          <div>
            <h2>Variações</h2>
            <p>Use para sabores, tamanhos, cores ou modelos do mesmo produto.</p>
          </div>
          <label className={styles.switch}>
            <input type="checkbox" checked={hasVariations} onChange={toggleVariations} />
            <span>Este produto possui variações</span>
          </label>
        </div>

        <input type="hidden" name="variacoes_json" value={variationsJson} />

        {hasVariations && (
          <div className={styles.variationList}>
            {variations.map((variation, index) => (
              <article className={styles.variationCard} key={variation.key}>
                <header>
                  <strong>Variação {index + 1}</strong>
                  <button type="button" onClick={() => removeVariation(index)}>Remover</button>
                </header>

                <div className={styles.grid}>
                  <label>
                    Nome da opção
                    <input
                      required
                      value={variation.nome}
                      onChange={(event) => updateVariation(index, "nome", event.target.value)}
                      placeholder="Ex: Morango"
                    />
                  </label>
                  <label>
                    SKU
                    <input
                      value={variation.sku}
                      onChange={(event) => updateVariation(index, "sku", event.target.value)}
                      placeholder="VIR-GEL-MOR"
                    />
                  </label>
                  <label>
                    Preço próprio
                    <input
                      inputMode="decimal"
                      value={variation.preco}
                      onChange={(event) => updateVariation(index, "preco", event.target.value)}
                      placeholder="Vazio = preço principal"
                    />
                  </label>
                  <label>
                    Estoque
                    <input
                      type="number"
                      min="0"
                      step="1"
                      required
                      value={variation.quantidade}
                      onChange={(event) => updateVariation(index, "quantidade", event.target.value)}
                    />
                  </label>
                </div>

                <label className={styles.variationImage}>
                  Foto específica desta variação
                  <input
                    type="file"
                    name={`variacao_imagem_${index}`}
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                  />
                </label>
              </article>
            ))}

            <button
              type="button"
              className={styles.addVariation}
              onClick={() => setVariations((current) => [...current, emptyVariation()])}
            >
              + Adicionar outra variação
            </button>
          </div>
        )}
      </div>
    </>
  );
}
