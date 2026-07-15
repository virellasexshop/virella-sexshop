import Link from "next/link";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footerGrid">
        <div>
          <Link href="/" className="footerBrand">
            Virella Sexshop
          </Link>

          <p>
            Boutique íntima premium com curadoria, privacidade e entrega
            discreta para todo o Brasil.
          </p>
        </div>

        <div>
          <h4>Loja</h4>
          <Link href="/catalogo">Catálogo</Link>
          <Link href="/catalogo?categoria=cosmeticos">Cosméticos</Link>
          <Link href="/catalogo?categoria=vibradores">Vibradores</Link>
          <Link href="/catalogo?categoria=lingeries">Lingeries</Link>
        </div>

        <div>
          <h4>Atendimento</h4>
          <Link href="/contato">Contato</Link>
          <Link href="/politica-de-entrega">Entrega discreta</Link>
          <Link href="/trocas">Trocas e devoluções</Link>
          <Link href="/privacidade">Privacidade</Link>
        </div>

        <div>
          <h4>Segurança</h4>
          <p>
            Pagamento protegido, dados criptografados e embalagem sem
            identificação do conteúdo.
          </p>
        </div>
      </div>

      <div className="container footerBottom">
        <span>© 2026  Virella Sexshop</span>
        <span>Boutique premium íntima</span>
      </div>
    </footer>
  );
}