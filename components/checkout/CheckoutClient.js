"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { getCart } from "@/lib/carrinho";
import styles from "./CheckoutClient.module.css";

const money = (value) => Number(value || 0).toLocaleString("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const STATES = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"];

export default function CheckoutClient() {
  const router = useRouter();
  const [cart, setCart] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const [sessionToken, setSessionToken] = useState("");
  const [shippingOptions, setShippingOptions] = useState([]);
  const [selectedShippingId, setSelectedShippingId] = useState("");
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingError, setShippingError] = useState("");
  const [quotedPostalCode, setQuotedPostalCode] = useState("");
  const [customer, setCustomer] = useState({
    nome: "", email: "", telefone: "", documento: "", cep: "", rua: "", numero: "",
    complemento: "", bairro: "", cidade: "", estado: "",
  });

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      const currentCart = getCart();
      setCart(currentCart);

      const supabase = createSupabaseBrowserClient();
      supabase.auth.getUser().then(({ data }) => {
        if (!active) return;
        if (!data.user) {
          router.replace("/login?redirect=%2Fcheckout");
          return;
        }
        supabase.auth.getSession().then(({ data: sessionData }) => {
          if (active) setSessionToken(sessionData.session?.access_token || "");
        });
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
  }, [router]);

  function updateField(event) {
    const { name, value } = event.target;
    setCustomer((current) => ({ ...current, [name]: value }));
    if (name === "cep") {
      setShippingOptions([]);
      setSelectedShippingId("");
      setShippingError("");
      setQuotedPostalCode("");
    }
  }

  async function calculateShipping() {
    const postalCode = customer.cep.replace(/\D/g, "");
    if (postalCode.length !== 8) {
      setShippingError("Digite os 8 números do CEP.");
      return;
    }
    if (!sessionToken) {
      setShippingError("Sua sessão ainda está carregando. Tente novamente.");
      return;
    }

    setShippingLoading(true);
    setShippingError("");
    setShippingOptions([]);
    setSelectedShippingId("");

    try {
      const response = await fetch("/api/frete/cotacao", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ items: cart, cep: postalCode }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      setShippingOptions(result.opcoes || []);
      setQuotedPostalCode(postalCode);
      if (result.opcoes?.length) setSelectedShippingId(result.opcoes[0].id);
    } catch (shippingCalculationError) {
      setShippingError(
        shippingCalculationError.message || "Não foi possível calcular o frete."
      );
    } finally {
      setShippingLoading(false);
    }
  }

  async function startPayment(event) {
    event.preventDefault();
    setPaying(true);
    setError("");

    try {
      const supabase = createSupabaseBrowserClient();
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        router.push("/login?redirect=%2Fcheckout");
        return;
      }
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          items: cart,
          customer,
          shipping_service_id: selectedShippingId,
        }),
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

  const selectedShipping = shippingOptions.find(
    (option) => option.id === selectedShippingId
  );
  const currentPostalCode = customer.cep.replace(/\D/g, "");
  const shippingIsCurrent = quotedPostalCode === currentPostalCode;
  const orderTotal = Number(summary?.subtotal || 0) + Number(
    shippingIsCurrent ? selectedShipping?.preco || 0 : 0
  );

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
            <div className={styles.gridTwo}><label>Telefone<input name="telefone" value={customer.telefone} onChange={updateField} autoComplete="tel" placeholder="(11) 99999-9999" required /></label><label>CPF/CNPJ do destinatário<input name="documento" value={customer.documento} onChange={updateField} inputMode="numeric" autoComplete="off" placeholder="Somente números" maxLength="18" required /></label></div>
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

          <div className={styles.formCard}>
            <div className={styles.cardHeading}><span>03</span><h2>Forma de entrega</h2></div>
            <div className={styles.shippingCalculator}>
              <div>
                <strong>Calcule pelo CEP informado acima</strong>
                <p>Veja preços e prazos disponíveis para o seu endereço.</p>
              </div>
              <button type="button" onClick={calculateShipping} disabled={shippingLoading}>
                {shippingLoading ? "Calculando..." : "Calcular frete"}
              </button>
            </div>

            {shippingError && <p className={styles.shippingError}>{shippingError}</p>}

            {shippingOptions.length > 0 && shippingIsCurrent && (
              <div className={styles.shippingOptions}>
                {shippingOptions.map((option) => (
                  <label
                    key={option.id}
                    className={`${styles.shippingOption} ${
                      selectedShippingId === option.id ? styles.shippingOptionSelected : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="shipping_service"
                      value={option.id}
                      checked={selectedShippingId === option.id}
                      onChange={() => setSelectedShippingId(option.id)}
                    />
                    {option.logo_url ? (
                      <img src={option.logo_url} alt="" />
                    ) : (
                      <span className={styles.shippingIcon}>V</span>
                    )}
                    <span className={styles.shippingDescription}>
                      <strong>{option.transportadora} — {option.servico}</strong>
                      <small>
                        {option.prazo_dias
                          ? `Prazo estimado: até ${option.prazo_dias} dias úteis`
                          : "Prazo informado pela transportadora"}
                      </small>
                    </span>
                    <strong className={option.gratuito ? styles.freeShipping : ""}>
                      {option.gratuito ? "Grátis" : money(option.preco)}
                    </strong>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <aside className={styles.summary}>
          <span className={styles.summaryLabel}>Resumo do pedido</span>
          <div className={styles.items}>
            {summary?.items?.map((item) => (
              <div key={`${item.produto_id}:${item.variacao_id || "produto"}`} className={styles.item}>
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
            <div>
              <span>Entrega</span>
              <strong>
                {selectedShipping && shippingIsCurrent
                  ? selectedShipping.gratuito ? "Grátis" : money(selectedShipping.preco)
                  : "A calcular"}
              </strong>
            </div>
            <div className={styles.total}><span>Total</span><strong>{money(orderTotal)}</strong></div>
          </div>
          {error && <p className={styles.error}>{error}</p>}
          <button
            type="submit"
            disabled={paying || !summary || !selectedShipping || !shippingIsCurrent}
          >
            {paying ? "Abrindo Mercado Pago..." : "Pagar com Mercado Pago"}
          </button>
          {!selectedShipping && (
            <p className={styles.shippingHint}>Calcule e escolha uma forma de entrega para continuar.</p>
          )}
          <p className={styles.secure}>Pagamento processado pelo Mercado Pago. A Virella não recebe os dados do seu cartão.</p>
          <Link href="/carrinho" className={styles.back}>← Voltar ao carrinho</Link>
        </aside>
      </form>
    </section>
  );
}
