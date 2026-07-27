import Link from "next/link";
import styles from "./HomeTrust.module.css";

const instagramUrl = "https://www.instagram.com/virella.intima/";
const whatsappUrl = "https://w.app/8oozkx";

export default function TrustSection() {
  const companyName = process.env.NEXT_PUBLIC_VIRELLA_RAZAO_SOCIAL;
  const cnpj = process.env.NEXT_PUBLIC_VIRELLA_CNPJ;

  return (
    <section className={styles.trustSection}>
      <div className={`container ${styles.trustPanel}`}>
        <div className={styles.trustIntro}>
          <span className="kicker">Confiança em cada etapa</span>
          <h2>Uma compra íntima deve ser também tranquila.</h2>
          <p>
            Canais oficiais, políticas transparentes e atendimento direto para
            você comprar com segurança e privacidade.
          </p>
        </div>

        <div className={styles.trustLinks}>
          <Link href="/privacidade">
            <span>Dados protegidos</span>
            <strong>Política de privacidade</strong>
            <small>Como cuidamos das suas informações ↗</small>
          </Link>
          <Link href="/trocas">
            <span>Compra transparente</span>
            <strong>Trocas e devoluções</strong>
            <small>Consulte regras e orientações ↗</small>
          </Link>
          <a href={whatsappUrl} target="_blank" rel="noreferrer">
            <span>Atendimento humano</span>
            <strong>Fale pelo WhatsApp</strong>
            <small>Canal oficial e reservado ↗</small>
          </a>
          <a href={instagramUrl} target="_blank" rel="noreferrer">
            <span>Virella oficial</span>
            <strong>Acompanhe no Instagram</strong>
            <small>Conteúdo, novidades e lançamentos ↗</small>
          </a>
        </div>

        {(companyName || cnpj) && (
          <div className={styles.trustCompany}>
            <span>Identificação da empresa</span>
            {companyName && <strong>{companyName}</strong>}
            {cnpj && <small>CNPJ {cnpj}</small>}
          </div>
        )}
      </div>
    </section>
  );
}
