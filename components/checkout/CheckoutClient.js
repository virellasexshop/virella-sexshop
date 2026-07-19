"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { getCart } from "@/lib/carrinho";
import styles from "./CheckoutClient.module.css";

const money = (value) => Number(value || 0).toLocaleString("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const STATES = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"];

export default function CheckoutClient() {
  const [cart, setCart] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const [customer, setCustomer] = useState({
    nome: "", email: "", telefone: "", cep: "", rua: "", numero: "",
    complemento: "", bairro: "", cidade: "", estado: "",
  });

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      const currentCart = getCart();
      setCart(currentCart);

      const supabase = createSupabaseBrowserClient();
      supabase.auth.getUser().then(({ data }) => {
        if (!active || !data.user) return;
        setCustomer((current) => ({
          ...current,
          nome: data.user.user_metadata?.nome || "",
          email: data.user.email || "",
        }));
      });

      if (!currentCart.length) {
        setLoading(false);
        return;
      }

      fetch("/api/checkout/resumo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: currentCart }),
      })
        .then(async (response) => {
          const data = await response.json();
          if (!response.ok) throw new Error(data.error);
          if (active) setSummary(data);
        })
        .catch((fetchError) => {
          if (active) setError(fetchError.message || "Não foi possível calcular o pedido.");
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 0);

    return () => { active = false; window.clearTimeout(timer); };
  }, []);

  function updateField(event) {
    const { name, value } = event.target;
    setCustomer((current) => ({ ...current, [name]: value }));
  }

  async function startPayment(event) {
    event.preventDefault();
    setPaying(true);
    setError("");

    try {
      const supabase = createSupabaseBrowserClient();
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ items: cart, customer }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      window.location.assign(result.checkout_url);
    } catch (paymentError) {
      setError(paymentError.message || "Não foi possível abrir o pagamento.");
      setPaying(false);
    }
  }

  if (loading) return <div className={styles.stateCard}>Preparando checkout seguro...</div>;

  if (!cart.length) {
    return (
      <section className={styles.empty}>
        <span className="eyebrow">Seu carrinho</span>
        <h1>Nenhum produto para finalizar.</h1>
        <Link href="/catalogo">Explorar produtos</Link>
      </section>
    );
  }

  return (
    <section className={styles.page}>
      <header className={styles.heading}>
        <span className="eyebrow">Finalização segura</span>
        <h1>Concluir pedido</h1>
        <p>Seus dados serão usados somente para pagamento e entrega discreta.</p>
      </header>

      <form className={styles.layout} onSubmit={startPayment}>
        <div className={styles.formColumn}>
          <div className={styles.formCard}>
            <div className={styles.cardHeading}><span>01</span><h2>Contato</h2></div>
            <div className={styles.gridTwo}>
              <label>Nome completo<input name="nome" value={customer.nome} onChange={updateField} autoComplete="name" required /></label>
              <label>E-mail<input name="email" type="email" value={customer.email} onChange={updateField} autoComplete="email" required /></label>
            </div>
            <label>Telefone<input name="telefone" value={customer.telefone} onChange={updateField} autoComplete="tel" placeholder="(11) 99999-9999" /></label>
          </div>

          <div className={styles.formCard}>
            <div className={styles.cardHeading}><span>02</span><h2>Endereço de entrega</h2></div>
            <div className={styles.gridAddress}>
              <label>CEP<input name="cep" value={customer.cep} onChange={updateField} inputMode="numeric" autoComplete="postal-code" maxLength="9" required /></label>
              <label className={styles.street}>Rua<input name="rua" value={customer.rua} onChange={updateField} autoComplete="address-line1" required /></label>
              <label>Número<input name="numero" value={customer.numero} onChange={updateField} required /></label>
              <label>Complemento<input name="complemento" value={customer.complemento} onChange={updateField} autoComplete="address-line2" /></label>
              <label>Bairro<input name="bairro" value={customer.bairro} onChange={updateField} required /></label>
              <label>Cidade<input name="cidade" value={customer.cidade} onChange={updateField} autoComplete="address-level2" required /></label>
              <label>Estado<select name="estado" value={customer.estado} onChange={updateField} autoComplete="address-level1" required><option value="">UF</option>{STATES.map((state) => <option key={state}>{state}</option>)}</select></label>
            </div>
          </div>
        </div>

        <aside className={styles.summary}>
          <span className={styles.summaryLabel}>Resumo do pedido</span>
          <div className={styles.items}>
            {summary?.items?.map((item) => (
              <div key={item.produto_id} className={styles.item}>
                <div
                  className={styles.thumb}
                  style={item.imagem_url ? { backgroundImage: `url(${item.imagem_url})` } : undefined}
                  aria-hidden="true"
                >
                  {!item.imagem_url && "V"}
                </div>
                <div><strong>{item.nome}</strong><small>{item.quantidade} × {money(item.preco_unitario)}</small></div>
                <span>{money(item.total)}</span>
              </div>
            ))}
          </div>
          <div className={styles.totals}>
            <div><span>Subtotal</span><strong>{money(summary?.subtotal)}</strong></div>
            <div><span>Entrega</span><strong>{summary?.frete ? money(summary.frete) : "Grátis"}</strong></div>
            <div className={styles.total}><span>Total</span><strong>{money(summary?.total)}</strong></div>
          </div>
          {error && <p className={styles.error}>{error}</p>}
          <button type="submit" disabled={paying || !summary}>
            {paying ? "Abrindo Mercado Pago..." : "Pagar com Mercado Pago"}
          </button>
          <p className={styles.secure}>Pagamento processado pelo Mercado Pago. A Virella não recebe os dados do seu cartão.</p>
          <Link href="/carrinho" className={styles.back}>← Voltar ao carrinho</Link>
        </aside>
      </form>
    </section>
  );
}
