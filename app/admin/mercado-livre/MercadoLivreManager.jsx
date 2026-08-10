"use client";

import { useMemo, useState } from "react";
import styles from "./mercado-livre.module.css";

function money(value) {
  return Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function parseLastError(value) {
  if (!value) return "";
  try {
    const parsed = JSON.parse(value);
    return parsed?.message || parsed?.cause?.map?.((c) => c?.message).filter(Boolean).join(" • ") || value;
  } catch {
    return value;
  }
}

function initialForm(product) {
  return {
    product_id: product.id,
    title: product.mapping?.ml_title || product.nome,
    price: product.mapping?.ml_price || product.preco,
    available_quantity: product.mapping?.available_quantity || 10,
    category_id: product.mapping?.category_id || "",
    listing_type_id: product.mapping?.listing_type_id || "gold_special",
    condition: product.mapping?.condition || "new",
    variation_attribute_id: product.mapping?.variation_attribute_id || "",
    brand: "",
    model: "",
    gtin: product.codigo_barras || "",
    empty_gtin_reason: "",
    description: "",
    attributes: {},
  };
}

export default function MercadoLivreManager({ initialProducts, account }) {
  const [products, setProducts] = useState(initialProducts || []);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(null);
  const [required, setRequired] = useState([]);
  const [variationAttributes, setVariationAttributes] = useState([]);
  const [gtinMeta, setGtinMeta] = useState({ required: false, conditionalRequired: false, attribute: null, emptyReason: null });
  const [categoryCandidates, setCategoryCandidates] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [categoryPath, setCategoryPath] = useState([]);
  const [categoryName, setCategoryName] = useState("");
  const [categoryValidated, setCategoryValidated] = useState(false);
  const [categoryBrowserOpen, setCategoryBrowserOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((item) => item.nome.toLowerCase().includes(q));
  }, [products, query]);

  function openProduct(product) {
    setSelected(product);
    setForm(initialForm(product));
    setRequired([]);
    setVariationAttributes([]);
    setGtinMeta({ required: false, conditionalRequired: false, attribute: null, emptyReason: null });
    setCategoryCandidates([]);
    setCategoryOptions([]);
    setCategoryPath([]);
    setCategoryName("");
    setCategoryValidated(Boolean(product.mapping?.category_id));
    setCategoryBrowserOpen(false);
    setMessage("");
  }

  function updateField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function api(url, options) {
    const response = await fetch(url, options);
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok === false) {
      const details = Array.isArray(data?.details?.cause)
        ? data.details.cause.map((item) => item?.message).filter(Boolean).join(" • ")
        : "";
      throw new Error(details || data.error || `Erro HTTP ${response.status}`);
    }
    return data;
  }

  async function loadAttributes(categoryId) {
    if (!categoryId) return;
    const data = await api(
      `/api/mercado-livre/category-attributes?category_id=${encodeURIComponent(categoryId)}`
    );
    setRequired(data.required || []);
    setVariationAttributes(data.variationAttributes || []);
    setGtinMeta(data.gtin || { required: false, conditionalRequired: false, attribute: null, emptyReason: null });
  }

  async function suggestCategory() {
    if (!form?.title) return;
    setLoading(true);
    setMessage("");
    setCategoryValidated(false);
    try {
      const data = await api(`/api/mercado-livre/categories?q=${encodeURIComponent(form.title)}`);
      const candidates = Array.isArray(data.candidates) ? data.candidates : [];
      setCategoryCandidates(candidates);
      if (!candidates.length) {
        setMessage("O Mercado Livre não encontrou sugestões confiáveis. Use ‘Escolher categoria’ para navegar manualmente.");
      } else {
        setMessage("Confira as sugestões abaixo e selecione a categoria correta antes de publicar.");
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function chooseCategory(categoryId, name = "") {
    updateField("category_id", categoryId);
    setCategoryName(name || categoryId);
    setCategoryCandidates([]);
    setCategoryValidated(false);
    setLoading(true);
    setMessage("");
    try {
      await loadAttributes(categoryId);
      setCategoryValidated(true);
      setMessage(`Categoria selecionada: ${name || categoryId}. Confira os atributos obrigatórios.`);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function openCategoryBrowser() {
    setLoading(true);
    setMessage("");
    try {
      const data = await api("/api/mercado-livre/category-options");
      setCategoryOptions(data.categories || []);
      setCategoryPath([]);
      setCategoryBrowserOpen(true);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function browseCategory(category) {
    setLoading(true);
    setMessage("");
    try {
      const data = await api(`/api/mercado-livre/category-options?parent_id=${encodeURIComponent(category.id)}`);
      if (data.leaf || !data.categories?.length) {
        setCategoryBrowserOpen(false);
        await chooseCategory(category.id, category.name);
        return;
      }
      setCategoryPath((current) => [...current, category]);
      setCategoryOptions(data.categories || []);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function restartCategoryBrowser() {
    await openCategoryBrowser();
  }

  async function inspectCategory() {
    if (!form?.category_id) return;
    setLoading(true);
    setMessage("");
    try {
      await loadAttributes(form.category_id);
      setCategoryValidated(true);
      setCategoryName(form.category_id);
      setMessage("Categoria válida e carregada. Confira os atributos obrigatórios abaixo.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  function validateGtinBeforePublish() {
    const gtin = String(form?.gtin || "").trim();
    const reason = String(form?.empty_gtin_reason || "").trim();

    if ((gtinMeta.required || gtinMeta.conditionalRequired) && !gtin && !reason) {
      if (gtinMeta.canUseEmptyReason) {
        setMessage("Esta categoria exige GTIN/EAN. Informe o código de barras ou selecione um motivo aceito para a ausência do GTIN.");
      } else {
        setMessage("O Mercado Livre exige um GTIN/EAN real nesta categoria. O motivo de ausência não substitui o GTIN aqui.");
      }
      return false;
    }

    if (!gtin && reason && !gtinMeta.emptyReason) {
      setMessage("A categoria atual não aceita motivo de ausência de GTIN. Informe um GTIN/EAN ou revise a categoria.");
      return false;
    }

    return true;
  }

  async function publish() {
    if (!validateGtinBeforePublish()) return;
    setLoading(true);
    setMessage("");
    try {
      const data = await api("/api/mercado-livre/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const item = data.item;
      setProducts((current) =>
        current.map((product) =>
          product.id === selected.id
            ? {
                ...product,
                mapping: {
                  ...(product.mapping || {}),
                  ml_item_id: item.id,
                  ml_permalink: item.permalink,
                  status: item.status,
                  category_id: form.category_id,
                  listing_type_id: form.listing_type_id,
                  condition: form.condition,
                  ml_title: form.title,
                  ml_price: Number(form.price),
                  available_quantity: Number(form.available_quantity),
                  variation_attribute_id: form.variation_attribute_id || null,
                },
              }
            : product
        )
      );
      setMessage(`Publicado com sucesso: ${item.id}`);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function sync() {
    setLoading(true);
    setMessage("");
    try {
      const data = await api("/api/mercado-livre/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setMessage(`Sincronizado. Status atual: ${data.item.status || "ok"}`);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function changeStatus(status) {
    setLoading(true);
    setMessage("");
    try {
      const data = await api("/api/mercado-livre/item-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: selected.id, status }),
      });
      setProducts((current) =>
        current.map((product) =>
          product.id === selected.id
            ? { ...product, mapping: { ...product.mapping, status: data.item.status || status } }
            : product
        )
      );
      setMessage(status === "paused" ? "Anúncio pausado." : "Anúncio reativado.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function disconnect() {
    if (!confirm("Desconectar a conta do Mercado Livre deste painel?")) return;
    setLoading(true);
    try {
      await api("/api/mercado-livre/disconnect", { method: "POST" });
      window.location.reload();
    } catch (error) {
      alert(error.message);
      setLoading(false);
    }
  }

  if (!account) {
    return (
      <section className={styles.connectCard}>
        <div>
          <span className={styles.eyebrow}>Primeiro acesso</span>
          <h2>Conecte a conta de vendedor do Mercado Livre</h2>
          <p>
            A autorização é feita pelo próprio Mercado Livre. Sua senha não passa pelo site da Virella.
          </p>
        </div>
        <a className="adminButton" href="/api/mercado-livre/auth">Conectar Mercado Livre</a>
      </section>
    );
  }

  return (
    <>
      <section className={styles.accountCard}>
        <div>
          <span className={styles.eyebrow}>Conta conectada</span>
          <strong>{account.nickname || `Vendedor ${account.seller_id}`}</strong>
          <small>ID {account.seller_id}</small>
        </div>
        <button type="button" className="adminButton secondary" onClick={disconnect} disabled={loading}>
          Desconectar
        </button>
      </section>

      <div className={styles.toolbar}>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar produto da loja"
          aria-label="Buscar produto"
        />
        <span>{filtered.length} produtos</span>
      </div>

      <div className={styles.productGrid}>
        {filtered.map((product) => (
          <article key={product.id} className={styles.productCard}>
            {product.imagem_principal ? (
              <img src={product.imagem_principal} alt={product.nome} />
            ) : (
              <div className={styles.placeholder}>Sem foto</div>
            )}
            <div className={styles.productInfo}>
              <div className={styles.productStatusLine}>
                <span className={product.mapping?.ml_item_id ? styles.published : styles.notPublished}>
                  {product.mapping?.ml_item_id ? "Publicado" : "Não publicado"}
                </span>
                {product.mapping?.status && <small>{product.mapping.status}</small>}
              </div>
              <strong>{product.nome}</strong>
              <span>{money(product.preco)}</span>
              {product.variacoes > 0 && <small>{product.variacoes} opções cadastradas</small>}
              {product.mapping?.ml_item_id && <small>{product.mapping.ml_item_id}</small>}
              {product.mapping?.last_error && (
                <small className={styles.inlineError}>{parseLastError(product.mapping.last_error)}</small>
              )}
            </div>
            <button className="adminRowButton" type="button" onClick={() => openProduct(product)}>
              {product.mapping?.ml_item_id ? "Gerenciar anúncio" : "Configurar e publicar"}
            </button>
          </article>
        ))}
      </div>

      {selected && form && (
        <div className={styles.modalBackdrop} onMouseDown={() => !loading && setSelected(null)}>
          <section className={styles.modal} onMouseDown={(event) => event.stopPropagation()}>
            <header className={styles.modalHeader}>
              <div>
                <span className={styles.eyebrow}>Mercado Livre</span>
                <h2>{selected.nome}</h2>
              </div>
              <button type="button" onClick={() => setSelected(null)} className={styles.closeButton}>×</button>
            </header>

            <div className={styles.formGrid}>
              <label className={styles.full}>
                Título do anúncio
                <input value={form.title} maxLength={60} onChange={(e) => updateField("title", e.target.value)} />
                <small>{form.title.length}/60</small>
              </label>

              <label>
                Preço no ML
                <input type="number" min="0.01" step="0.01" value={form.price} onChange={(e) => updateField("price", e.target.value)} />
              </label>
              <label>
                Quantidade no ML
                <input type="number" min="1" step="1" value={form.available_quantity} onChange={(e) => updateField("available_quantity", e.target.value)} />
              </label>

              <label>
                Tipo de anúncio
                <select value={form.listing_type_id} onChange={(e) => updateField("listing_type_id", e.target.value)}>
                  <option value="gold_special">Clássico</option>
                  <option value="gold_pro">Premium</option>
                </select>
              </label>
              <label>
                Condição
                <select value={form.condition} onChange={(e) => updateField("condition", e.target.value)}>
                  <option value="new">Novo</option>
                  <option value="used">Usado</option>
                </select>
              </label>

              <div className={`${styles.categoryRow} ${styles.full}`}>
                <label>
                  Categoria Mercado Livre
                  <input
                    value={form.category_id}
                    placeholder="Ex: MLB1234"
                    onChange={(e) => { updateField("category_id", e.target.value.toUpperCase()); setCategoryValidated(false); setCategoryName(""); }}
                  />
                </label>
                <button type="button" className="adminRowButton" onClick={suggestCategory} disabled={loading}>
                  Buscar sugestões
                </button>
                <button type="button" className="adminRowButton" onClick={openCategoryBrowser} disabled={loading}>
                  Escolher categoria
                </button>
                <button type="button" className="adminRowButton" onClick={inspectCategory} disabled={loading || !form.category_id}>
                  Conferir ID
                </button>
              </div>

              {(categoryName || form.category_id) && (
                <div className={`${styles.selectedCategory} ${styles.full}`}>
                  <span>Categoria selecionada</span>
                  <strong>{categoryName || form.category_id}</strong>
                  <small>{form.category_id}{categoryValidated ? " • validada" : " • ainda não validada"}</small>
                </div>
              )}

              {categoryCandidates.length > 0 && (
                <div className={`${styles.categorySuggestions} ${styles.full}`}>
                  <strong>Sugestões do Mercado Livre</strong>
                  <p>Não publicamos automaticamente: escolha somente se a categoria realmente corresponder ao produto.</p>
                  <div className={styles.categorySuggestionGrid}>
                    {categoryCandidates.map((category) => (
                      <button
                        key={category.category_id}
                        type="button"
                        onClick={() => chooseCategory(category.category_id, category.category_name)}
                        disabled={loading}
                      >
                        <strong>{category.category_name}</strong>
                        {category.domain_name && <span>{category.domain_name}</span>}
                        <small>{category.category_id}</small>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {categoryBrowserOpen && (
                <div className={`${styles.categoryBrowser} ${styles.full}`}>
                  <div className={styles.categoryBrowserHeader}>
                    <div>
                      <strong>Escolher categoria manualmente</strong>
                      <p>Entre nas categorias até chegar à opção mais específica para o produto.</p>
                    </div>
                    {categoryPath.length > 0 && (
                      <button type="button" className="adminRowButton" onClick={restartCategoryBrowser} disabled={loading}>
                        Voltar ao início
                      </button>
                    )}
                  </div>
                  {categoryPath.length > 0 && (
                    <div className={styles.categoryBreadcrumb}>
                      {categoryPath.map((item) => <span key={item.id}>{item.name}</span>)}
                    </div>
                  )}
                  <div className={styles.categoryOptionGrid}>
                    {categoryOptions.map((category) => (
                      <button key={category.id} type="button" onClick={() => browseCategory(category)} disabled={loading}>
                        <span>{category.name}</span><small>{category.id}</small>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <label>
                Marca
                <input value={form.brand} onChange={(e) => updateField("brand", e.target.value)} placeholder="Ex: Hot Flowers" />
              </label>
              <label>
                Modelo
                <input value={form.model} onChange={(e) => updateField("model", e.target.value)} placeholder="Quando aplicável" />
              </label>
              <div className={styles.full}>
                <label>
                  GTIN / EAN {(gtinMeta.required || gtinMeta.conditionalRequired) ? "(obrigatório nesta categoria)" : ""}
                  <input
                    value={form.gtin}
                    onChange={(e) => {
                      updateField("gtin", e.target.value.replace(/\D/g, ""));
                      if (e.target.value) updateField("empty_gtin_reason", "");
                    }}
                    placeholder="Número abaixo do código de barras"
                    inputMode="numeric"
                  />
                </label>

                {(gtinMeta.required || gtinMeta.conditionalRequired) && !String(form.gtin || "").trim() && gtinMeta.canUseEmptyReason && gtinMeta.emptyReason && (
                  <div style={{ marginTop: 12, padding: 16, border: "1px solid #6d5521", background: "#1b160b" }}>
                    <strong style={{ display: "block", marginBottom: 8 }}>Este produto não possui GTIN/EAN?</strong>
                    <p style={{ margin: "0 0 12px", opacity: 0.82 }}>
                      Se realmente não houver código de barras, informe o motivo aceito pelo Mercado Livre. Não invente um GTIN.
                    </p>
                    <label>
                      Motivo da ausência do GTIN
                      {Array.isArray(gtinMeta.emptyReason.values) && gtinMeta.emptyReason.values.length > 0 ? (
                        <select
                          value={form.empty_gtin_reason || ""}
                          onChange={(e) => updateField("empty_gtin_reason", e.target.value)}
                        >
                          <option value="">Selecione o motivo</option>
                          {gtinMeta.emptyReason.values.map((value) => (
                            <option key={value.id || value.name} value={value.name}>{value.name}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          value={form.empty_gtin_reason || ""}
                          onChange={(e) => updateField("empty_gtin_reason", e.target.value)}
                          placeholder="Informe o motivo aceito pela categoria"
                        />
                      )}
                    </label>
                  </div>
                )}

                {(gtinMeta.required || gtinMeta.conditionalRequired) && !gtinMeta.canUseEmptyReason && !String(form.gtin || "").trim() && (
                  <small style={{ display: "block", marginTop: 8 }}>
                    O Mercado Livre exige um GTIN/EAN real nesta categoria e não aceita a opção sem código de barras. Use o GTIN da embalagem/fornecedor ou revise a categoria se ela estiver incorreta.
                  </small>
                )}
              </div>

              {selected.variacoes > 0 && (
                <label className={styles.full}>
                  Como representar as opções do produto
                  <select
                    value={form.variation_attribute_id}
                    onChange={(e) => updateField("variation_attribute_id", e.target.value)}
                  >
                    <option value="">Publicar como um único anúncio sem opções</option>
                    {variationAttributes.map((attr) => (
                      <option key={attr.id} value={attr.id}>{attr.name} ({attr.id})</option>
                    ))}
                  </select>
                  <small>
                    Para enviar as opções separadamente, primeiro carregue a categoria. O Mercado Livre define quais atributos podem virar variações em cada categoria.
                  </small>
                </label>
              )}

              {required.length > 0 && (
                <div className={`${styles.requiredBox} ${styles.full}`}>
                  <strong>Atributos exigidos pela categoria</strong>
                  <p>Preencha os que não forem cobertos por Marca, Modelo e GTIN.</p>
                  <div className={styles.requiredGrid}>
                    {required
                      .filter((attr) => !["BRAND", "MODEL", "GTIN", "EMPTY_GTIN_REASON"].includes(attr.id))
                      .map((attr) => (
                        <label key={attr.id}>
                          {attr.name}
                          {attr.values?.length > 0 && attr.values.length <= 100 ? (
                            <select
                              value={form.attributes?.[attr.id] || ""}
                              onChange={(e) =>
                                updateField("attributes", { ...form.attributes, [attr.id]: e.target.value })
                              }
                            >
                              <option value="">Selecione</option>
                              {attr.values.map((value) => (
                                <option key={value.id || value.name} value={value.name}>{value.name}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              value={form.attributes?.[attr.id] || ""}
                              onChange={(e) =>
                                updateField("attributes", { ...form.attributes, [attr.id]: e.target.value })
                              }
                            />
                          )}
                          <small>{attr.id}</small>
                        </label>
                      ))}
                  </div>
                </div>
              )}

              <label className={styles.full}>
                Descrição adicional no ML (opcional)
                <textarea
                  rows="5"
                  value={form.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  placeholder="Se deixar vazio, usamos a descrição do produto cadastrada no site."
                />
              </label>
            </div>

            {message && <div className={message.toLowerCase().includes("sucesso") || message.toLowerCase().includes("sincronizado") ? styles.successBox : styles.messageBox}>{message}</div>}

            <footer className={styles.modalActions}>
              {selected.mapping?.ml_item_id ? (
                <>
                  {selected.mapping.ml_permalink && (
                    <a href={selected.mapping.ml_permalink} target="_blank" rel="noreferrer" className="adminButton secondary">
                      Ver anúncio
                    </a>
                  )}
                  <button type="button" className="adminButton" onClick={sync} disabled={loading}>
                    {loading ? "Aguarde..." : "Sincronizar preço e título"}
                  </button>
                  <button
                    type="button"
                    className="adminButton secondary"
                    onClick={() => changeStatus(selected.mapping?.status === "paused" ? "active" : "paused")}
                    disabled={loading}
                  >
                    {selected.mapping?.status === "paused" ? "Reativar anúncio" : "Pausar anúncio"}
                  </button>
                </>
              ) : (
                <button type="button" className="adminButton" onClick={publish} disabled={
                    loading ||
                    !form.category_id ||
                    !categoryValidated ||
                    ((gtinMeta.required || gtinMeta.conditionalRequired) && !String(form.gtin || "").trim() && !(gtinMeta.canUseEmptyReason && String(form.empty_gtin_reason || "").trim()))
                  }>
                  {loading
                    ? "Publicando..."
                    : !categoryValidated
                      ? "Valide a categoria para publicar"
                      : (gtinMeta.required || gtinMeta.conditionalRequired) && !String(form.gtin || "").trim() && !(gtinMeta.canUseEmptyReason && String(form.empty_gtin_reason || "").trim())
                        ? "Informe o GTIN ou o motivo da ausência"
                        : "Publicar no Mercado Livre"}
                </button>
              )}
            </footer>
          </section>
        </div>
      )}
    </>
  );
}
