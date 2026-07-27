const benefits = [
  {
    number: "01",
    title: "Embalagem 100% discreta",
    text: "Sem identificação da loja ou do conteúdo.",
  },
  {
    number: "02",
    title: "Pagamento protegido",
    text: "Seus dados são processados em ambiente seguro.",
  },
  {
    number: "03",
    title: "Produtos originais",
    text: "Curadoria cuidadosa de produtos selecionados.",
  },
  {
    number: "04",
    title: "Atendimento humanizado",
    text: "Conversa reservada antes e depois da compra.",
  },
];

export default function BenefitsStrip() {
  return (
    <section className={styles.benefitsSection} aria-label="Vantagens de comprar na Virella">
      <div className={`container ${styles.benefitsGrid}`}>
        {benefits.map((benefit) => (
          <article className={styles.benefitItem} key={benefit.number}>
            <span>{benefit.number}</span>
            <div>
              <h2>{benefit.title}</h2>
              <p>{benefit.text}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
import styles from "./HomeTrust.module.css";
