"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import styles from "./OrderHistory.module.css";

const money = (value) => Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const date = (value) => new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date(value));
const PAYMENT_LABEL = { aguardando: "Aguardando pagamento", em_analise: "Em análise", aprovado: "Pagamento aprovado", recusado: "Pagamento recusado", cancelado: "Cancelado", estornado: "Estornado", erro: "Erro no pagamento" };
const ORDER_LABEL = { novo: "Pedido recebido", em_separacao: "Em separação", enviado: "Enviado", entregue: "Entregue", cancelado: "Cancelado" };

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getSession().then(async ({ data }) => {
      const token = data.session?.access_token;
      if (!token) { if (active) setLoading(false); return; }
      const response = await fetch("/api/minha-conta/pedidos", { headers: { Authorization: `Bearer ${token}` } });
      const result = await response.json();
      if (active) { setOrders(result.orders || []); setLoading(false); }
    }).catch(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return (
    <section className={styles.history}>
      <div className={styles.heading}><div><span>Compras</span><h2>Meus pedidos</h2></div><Link href="/catalogo">Continuar comprando ↗</Link></div>
      {loading ? <p className={styles.message}>Carregando pedidos...</p> : orders.length ? (
        <div className={styles.list}>{orders.map((order) => (
          <article key={order.id} className={styles.order}>
            <header><div><span>Pedido</span><strong>#{order.numero}</strong></div><div><span>Data</span><strong>{date(order.criado_em)}</strong></div><div><span>Total</span><strong>{money(order.total)}</strong></div></header>
            <div className={styles.statusLine}><span className={`${styles.badge} ${order.status_pagamento === "aprovado" ? styles.approved : ""}`}>{PAYMENT_LABEL[order.status_pagamento] || order.status_pagamento}</span><span>{ORDER_LABEL[order.status_pedido] || order.status_pedido}</span></div>
            <ul>{(order.pedido_itens || []).map((item, index) => <li key={`${item.nome}-${index}`}><span>{item.quantidade}×</span> {item.nome}</li>)}</ul>
          </article>
        ))}</div>
      ) : <div className={styles.empty}><p>Você ainda não possui pedidos nesta conta.</p><Link href="/catalogo">Conhecer o catálogo</Link></div>}
    </section>
  );
}
