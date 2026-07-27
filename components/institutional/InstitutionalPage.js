import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import styles from "./InstitutionalPage.module.css";

export default function InstitutionalPage({ eyebrow, title, introduction, children }) {
  return (
    <>
      <Header />
      <main className={styles.page}>
        <header className={`container ${styles.hero}`}>
          <span className="kicker">{eyebrow}</span>
          <h1>{title}</h1>
          <p>{introduction}</p>
        </header>
        <section className={`container ${styles.content}`}>
          {children}
        </section>
      </main>
      <Footer />
    </>
  );
}
