"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import ProductCard from "@/components/products/ProductCard";

const filters = [
  { value: "todos", label: "Todos" },
  { value: "novidades", label: "Novidades" },
  { value: "ofertas", label: "Ofertas" },
  { value: "mais-vendidos", label: "Mais vendidos" },
];

function normalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export default function CategoryCatalogClient({ products, categoryName }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("todos");
  const [sort, setSort] = useState("recentes");
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  const visibleProducts = useMemo(() => {
    const term = normalize(search.trim());

    const filtered = products.filter((product) => {
      const searchable = normalize(
        `${product.nome} ${product.descricao_curta || ""} ${product.sku || ""}`
      );

      const matchesSearch = !term || searchable.includes(term);
      const matchesAvailability =
        !onlyAvailable || Number(product.quantidade || 0) > 0;

      let matchesFilter = true;
      if (filter === "novidades") matchesFilter = product.novo === true;
      if (filter === "ofertas") {
        matchesFilter = product.em_promocao === true;
      }
      if (filter === "mais-vendidos") matchesFilter = product.mais_vendido === true;

      return matchesSearch && matchesAvailability && matchesFilter;
    });

    return [...filtered].sort((a, b) => {
      const priceA = Number(a.preco_final ?? a.preco ?? 0);
      const priceB = Number(b.preco_final ?? b.preco ?? 0);

      if (sort === "menor-preco") return priceA - priceB;
      if (sort === "maior-preco") return priceB - priceA;
      if (sort === "nome") {
        return String(a.nome).localeCompare(String(b.nome), "pt-BR");
      }

      return new Date(b.criado_em || 0) - new Date(a.criado_em || 0);
    });
  }, [products, search, filter, sort, onlyAvailable]);

  function clearFilters() {
    setSearch("");
    setFilter("todos");
    setSort("recentes");
    setOnlyAvailable(false);
  }

  return (
    <div className="categoryCatalog">
      <div className="categoryCatalogIntro">
        <div>
          <span className="eyebrow">Explore a coleção</span>
          <h2>Escolha no seu ritmo.</h2>
        </div>
        <p>
          Produtos selecionados em {categoryName}, com compra segura,
          atendimento reservado e embalagem totalmente discreta.
        </p>
      </div>

      <div className="categoryCatalogTools">
        <label className="categorySearchField">
          <span>Buscar na coleção</span>
          <div>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Digite o nome do produto"
            />
            {search && (
              <button type="button" onClick={() => setSearch("")} aria-label="Limpar busca">
                ×
              </button>
            )}
          </div>
        </label>

        <label className="categorySortField">
          <span>Ordenar</span>
          <select value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="recentes">Mais recentes</option>
            <option value="menor-preco">Menor preço</option>
            <option value="maior-preco">Maior preço</option>
            <option value="nome">Nome: A–Z</option>
          </select>
        </label>
      </div>

      <div className="categoryFilterBar">
        <div className="categoryFilterPills" aria-label="Filtrar produtos">
          {filters.map((item) => (
            <button
              type="button"
              key={item.value}
              className={filter === item.value ? "active" : ""}
              aria-pressed={filter === item.value}
              onClick={() => setFilter(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <label className="availabilityToggle">
          <input
            type="checkbox"
            checked={onlyAvailable}
            onChange={(event) => setOnlyAvailable(event.target.checked)}
          />
          <span aria-hidden="true" />
          Somente disponíveis
        </label>
      </div>

      <div className="categoryResultsLine" aria-live="polite">
        <span>
          {visibleProducts.length} {visibleProducts.length === 1 ? "produto" : "produtos"}
        </span>
        <span>Envio discreto para todo o Brasil</span>
      </div>

      {visibleProducts.length > 0 ? (
        <div className="categoryProductGrid">
          {visibleProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="categoryEmptyState">
          <span>Nenhum resultado</span>
          <h2>Não encontramos produtos com esses filtros.</h2>
          <p>Tente uma busca diferente ou volte a visualizar toda a coleção.</p>
          <button type="button" onClick={clearFilters}>Limpar filtros</button>
        </div>
      ) : (
        <div className="categoryEmptyState">
          <span>Curadoria em preparação</span>
          <h2>Os produtos desta categoria aparecerão aqui.</h2>
          <p>
            Vincule os produtos à categoria no painel administrativo para
            publicar esta coleção.
          </p>
          <Link href="/catalogo">Explorar catálogo completo</Link>
        </div>
      )}
    </div>
  );
}
