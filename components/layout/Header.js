"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import SearchBar from "../ui/SearchBar";

const categorias = [
  {
    nome: "Cosméticos",
    menuNome: "Cosméticos sensoriais",
    href: "/categoria/cosmeticos",
  },
  {
    nome: "Vibradores",
    menuNome: "Vibradores premium",
    href: "/categoria/vibradores",
  },
  {
    nome: "Lingeries",
    menuNome: "Lingeries",
    href: "/categoria/lingeries",
  },
  {
    nome: "Kits",
    menuNome: "Kits selecionados",
    href: "/categoria/kits",
  },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);

  const pathname = usePathname();
  const dropdownRef = useRef(null);

  function abrirMenu() {
    setMenuOpen(true);
  }

  function fecharMenu() {
    setMenuOpen(false);
  }

  function fecharCategorias() {
    setCategoriesOpen(false);
  }

  function linkAtivo(href) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  useEffect(() => {
    fecharMenu();
    fecharCategorias();
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";

    function fecharComEscape(event) {
      if (event.key === "Escape") {
        fecharMenu();
        fecharCategorias();
      }
    }

    function fecharAoClicarFora(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        fecharCategorias();
      }
    }

    window.addEventListener("keydown", fecharComEscape);
    document.addEventListener("mousedown", fecharAoClicarFora);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", fecharComEscape);
      document.removeEventListener("mousedown", fecharAoClicarFora);
    };
  }, [menuOpen]);

  const algumaCategoriaAtiva = categorias.some((categoria) =>
    linkAtivo(categoria.href)
  );

  return (
    <>
      <header className="header">
        <div className="topBar">
          Entrega discreta para todo o Brasil
        </div>

        <div className="headerInner container">
          <button
            type="button"
            className="menuButton"
            onClick={abrirMenu}
            aria-label="Abrir menu lateral"
            aria-expanded={menuOpen}
            aria-controls="side-menu"
          >
            <span />
            <span />
          </button>

          <Link
            href="/"
            className="brand"
            aria-label=" Virella Sexshop — Página inicial"
          >
            <span>Virella</span>
            <strong>Sexshop</strong>
          </Link>

          <nav className="nav" aria-label="Navegação principal">

            <div
              ref={dropdownRef}
              className={
                categoriesOpen
                  ? "categoriesDropdown open"
                  : "categoriesDropdown"
              }
            >
              <button
                type="button"
                className={
                  algumaCategoriaAtiva
                    ? "categoriesButton active"
                    : "categoriesButton"
                }
                onClick={() => setCategoriesOpen((aberto) => !aberto)}
                aria-expanded={categoriesOpen}
                aria-controls="categories-menu"
              >
                <span>Categorias</span>

                <svg
                  className="categoriesArrow"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M6 9L12 15L18 9"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              <div
                id="categories-menu"
                className="categoriesMenu"
              >
                <div className="categoriesMenuHeader">
                  <span>Explorar</span>
                  <strong>Categorias</strong>
                </div>

                <div className="categoriesMenuLinks">
                  {categorias.map((categoria) => (
                    <Link
                      key={categoria.href}
                      href={categoria.href}
                      className={
                        linkAtivo(categoria.href) ? "active" : ""
                      }
                      onClick={fecharCategorias}
                    >
                      <span>{categoria.nome}</span>
                      <span aria-hidden="true">↗</span>
                    </Link>
                  ))}
                </div>

                <Link
                  href="/catalogo"
                  className="categoriesViewAll"
                  onClick={fecharCategorias}
                >
                  Ver todos os produtos
                </Link>
              </div>
            </div>
          </nav>

          <div className="headerActions">
            <SearchBar />

            <Link
              href="/login"
              className={
                linkAtivo("/login")
                  ? "headerLink active"
                  : "headerLink"
              }
            >
              Entrar
            </Link>

            <Link
              href="/carrinho"
              className={
                linkAtivo("/carrinho")
                  ? "cartButton active"
                  : "cartButton"
              }
            >
              Carrinho
            </Link>
          </div>
        </div>
      </header>

      <div
        className={
          menuOpen
            ? "sideMenuOverlay active"
            : "sideMenuOverlay"
        }
        onClick={fecharMenu}
        aria-hidden="true"
      />

      <aside
        id="side-menu"
        className={menuOpen ? "sideMenu active" : "sideMenu"}
        aria-hidden={!menuOpen}
      >
        <div className="sideMenuTop">
          <div>
            <span>Menu</span>
            <h3>Explorar categorias</h3>
          </div>

          <button
            type="button"
            onClick={fecharMenu}
            aria-label="Fechar menu"
          >
            ×
          </button>
        </div>

        <nav
          className="sideMenuLinks"
          aria-label="Categorias de produtos"
        >
          <Link href="/catalogo" onClick={fecharMenu}>
            Todos os produtos
          </Link>

          {categorias.map((categoria) => (
            <Link
              key={categoria.href}
              href={categoria.href}
              onClick={fecharMenu}
            >
              {categoria.menuNome}
            </Link>
          ))}

          <Link
            href="/catalogo?ordenacao=novidades"
            onClick={fecharMenu}
          >
            Novidades
          </Link>
        </nav>

        <div className="sideMenuFooter">
          <p>
            Compra segura, embalagem discreta e atendimento reservado.
          </p>
        </div>
      </aside>
    </>
  );
}