import InstitutionalPage from "@/components/institutional/InstitutionalPage";
import styles from "@/components/institutional/InstitutionalPage.module.css";

export const metadata = { title: "Contato | Virella Sexshop" };

export default function ContactPage() {
  return (
    <InstitutionalPage
      eyebrow="Atendimento reservado"
      title="Como podemos ajudar?"
      introduction="Converse diretamente com a equipe da Virella pelos nossos canais oficiais."
    >
      <div className={styles.contactGrid}>
        <a href="https://w.app/8oozkx" target="_blank" rel="noreferrer">
          <span>Resposta direta</span>
          <strong>WhatsApp</strong>
          <small>Abrir atendimento ↗</small>
        </a>
        <a
          href="https://www.instagram.com/virella.intima/"
          target="_blank"
          rel="noreferrer"
        >
          <span>Perfil oficial</span>
          <strong>Instagram</strong>
          <small>@virella.intima ↗</small>
        </a>
      </div>
    </InstitutionalPage>
  );
}
