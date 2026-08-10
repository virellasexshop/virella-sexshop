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
  }

  async function suggestCategory() {
    if (!form?.title) return;
    setLoading(true);
    setMessage("");
    try {
      const data = await api(`/api/mercado-livre/categories?q=${encodeURIComponent(form.title)}`);
      const category = data.category;
      if (!category?.category_id) throw new Error("O Mercado Livre não sugeriu uma categoria para esse título.");
      updateField("category_id", category.category_id);
      setMessage(`Categoria sugerida: ${category.category_name || category.category_id}`);
      await loadAttributes(category.category_id);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function inspectCategory() {
    if (!form?.category_id) return;
    setLoading(true);
    setMessage("");
    try {
      await loadAttributes(form.category_id);
      setMessage("Categoria carregada. Confira os atributos obrigatórios abaixo.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function publish() {
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
                    onChange={(e) => updateField("category_id", e.target.value.toUpperCase())}
                  />
                </label>
                <button type="button" className="adminRowButton" onClick={suggestCategory} disabled={loading}>
                  Sugerir categoria
                </button>
                <button type="button" className="adminRowButton" onClick={inspectCategory} disabled={loading || !form.category_id}>
                  Conferir atributos
                </button>
              </div>

              <label>
                Marca
                <input value={form.brand} onChange={(e) => updateField("brand", e.target.value)} placeholder="Ex: Hot Flowers" />
              </label>
              <label>
                Modelo
                <input value={form.model} onChange={(e) => updateField("model", e.target.value)} placeholder="Quando aplicável" />
              </label>
              <label className={styles.full}>
                GTIN / EAN
                <input value={form.gtin} onChange={(e) => updateField("gtin", e.target.value)} placeholder="Código de barras" />
              </label>

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
                      .filter((attr) => !["BRAND", "MODEL", "GTIN"].includes(attr.id))
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
                <button type="button" className="adminButton" onClick={publish} disabled={loading || !form.category_id}>
                  {loading ? "Publicando..." : "Publicar no Mercado Livre"}
                </button>
              )}
            </footer>
          </section>
        </div>
      )}
    </>
  );
}
