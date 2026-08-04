import Link from "next/link";

const INSTAGRAM_URL = "https://www.instagram.com/virella.intima/";
const WHATSAPP_URL = "https://wa.link/ktmq5m";

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.4" cy="6.7" r="1" className="footerSocialDot" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20.4 11.7a8.4 8.4 0 0 1-12.5 7.4L3 20.4l1.3-4.7a8.4 8.4 0 1 1 16.1-4Z" />
      <path d="M8.2 7.4c.2-.4.4-.4.7-.4h.5c.2 0 .4 0 .5.4l.8 2c.1.3 0 .5-.1.7l-.7.9c-.2.2-.1.4 0 .6.8 1.4 1.9 2.5 3.4 3.2.2.1.4.1.6-.1l.9-1.1c.2-.2.4-.3.7-.2l2 .9c.3.1.4.3.4.5 0 .3-.2 1.5-1.1 2.1-.7.5-1.7.8-2.6.5-1.1-.3-2.6-.8-4.5-2.5-2.2-2-3.6-4.4-3.7-6 0-.7.2-1.2.5-1.6.4-.4.8-.6 1.1-.6Z" />
    </svg>
  );
}

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

          <div className="footerSocials" aria-label="Redes sociais da Virella">
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram da Virella"
              title="Instagram"
            >
              <InstagramIcon />
            </a>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp da Virella"
              title="WhatsApp"
            >
              <WhatsAppIcon />
            </a>
          </div>
        </div>

        <div>
          <h4>Loja</h4>
          <Link href="/catalogo">Catálogo</Link>
          <Link href="/catalogo?categoria=cosmeticos">Cosméticos</Link>
          <Link href="/catalogo?categoria=vibradores">Vibradores</Link>
          <Link href="/catalogo?categoria=lingeries">Lingeries</Link>
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
