"use client";

import { useMemo, useState } from "react";
import ProductCard from "@/components/products/ProductCard";

export default function CatalogClient({ products, categories }) {
  const [category, setCategory] = useState("todas");
  const [sort, setSort] = useState("recentes");
  const [search, setSearch] = useState("");

  const visibleProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = products.filter((product) => {
      const productCategory = product.categorias?.slug || product.categoria_slug;
      const categoryMatch = category === "todas" || productCategory === category;
      const searchMatch = !term || `${product.nome} ${product.descricao_curta || ""}`.toLowerCase().includes(term);
      return categoryMatch && searchMatch;
    });

    return [...list].sort((a, b) => {
      const priceA = Number(a.preco_promocional || a.preco || 0);
      const priceB = Number(b.preco_promocional || b.preco || 0);
      if (sort === "menor-preco") return priceA - priceB;
      if (sort === "maior-preco") return priceB - priceA;
      if (sort === "nome") return String(a.nome).localeCompare(String(b.nome), "pt-BR");
      return new Date(b.criado_em || 0) - new Date(a.criado_em || 0);
    });
  }, [products, category, sort, search]);

  return (
    <section className="catalogContent container">
      <div className="catalogToolbar">
        <label className="catalogSearch">
          <span>Buscar</span>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="O que você procura?" />
        </label>

        <label className="catalogSort">
          <span>Ordenar por</span>
          <select value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="recentes">Mais recentes</option>
            <option value="menor-preco">Menor preço</option>
            <option value="maior-preco">Maior preço</option>
            <option value="nome">Nome</option>
          </select>
        </label>
      </div>

      <div className="categoryPills" aria-label="Filtrar por categoria">
        <button className={category === "todas" ? "active" : ""} onClick={() => setCategory("todas")}>Todos</button>
        {categories.map((item) => (
          <button key={item.id || item.slug} className={category === item.slug ? "active" : ""} onClick={() => setCategory(item.slug)}>
            {item.nome}
          </button>
        ))}
      </div>

      <div className="catalogResultLine">
        <span>{visibleProducts.length} produtos</span>
        <span>Entrega discreta em todo o Brasil</span>
      </div>

      {visibleProducts.length > 0 ? (
        <div className="catalogGrid">
          {visibleProducts.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      ) : (
        <div className="emptyState">
          <span>Nenhum resultado</span>
          <h2>Não encontramos produtos para este filtro.</h2>
          <button onClick={() => { setCategory("todas"); setSearch(""); }}>Limpar filtros</button>
        </div>
      )}
    </section>
  );
}
