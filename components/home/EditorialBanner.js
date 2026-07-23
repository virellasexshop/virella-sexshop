import styles from "./EditorialBanner.module.css";

export default function EditorialBanner() {
  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.banner}>
          <div className={styles.content}>
            <span className="kicker">Compra discreta</span>
            <h2>Embalagem neutra, pagamento seguro e atendimento reservado.</h2>
            <p>
              A experiência foi pensada para oferecer privacidade em cada etapa:
              da escolha do produto até a entrega.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
