export default function Newsletter() {
  return (
    <section className="newsletter">
      <div className="container newsletterInner">
        <div>
          <span className="kicker">Virella Sexshop</span>
          <h2>Receba novidades com discrição.</h2>
        </div>

        <form>
          <input placeholder="Seu melhor e-mail" />
          <button>Assinar</button>
        </form>
      </div>
    </section>
  );
}