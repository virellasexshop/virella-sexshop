"use client";

import { useEffect } from "react";
import Link from "next/link";
import { saveCart } from "@/lib/carrinho";
import styles from "./PaymentStatus.module.css";

const CONTENT = {
  success: { eyebrow: "Pagamento recebido", title: "Pedido confirmado.", text: "Recebemos o retorno do Mercado Pago. Você pode acompanhar a atualização do pedido em sua conta.", action: "Ver minha conta" },
  pending: { eyebrow: "Pagamento em análise", title: "Seu pedido está aguardando.", text: "Assim que o Mercado Pago confirmar o pagamento, o status do pedido será atualizado automaticamente.", action: "Ver minha conta" },
  failure: { eyebrow: "Pagamento não concluído", title: "Vamos tentar novamente?", text: "Nenhuma cobrança foi confirmada. Volte ao carrinho para escolher outra forma de pagamento.", action: "Voltar ao carrinho" },
};

export default function PaymentStatus({ status }) {
  const content = CONTENT[status] || CONTENT.pending;

  useEffect(() => {
    if (status === "success") saveCart([]);
  }, [status]);

  return (
    <section className={styles.card}>
      <span>{content.eyebrow}</span>
      <h1>{content.title}</h1>
      <p>{content.text}</p>
      <div>
        <Link href={status === "failure" ? "/carrinho" : "/minha-conta"}>{content.action}</Link>
        <Link href="/">Ir para a página inicial</Link>
      </div>
    </section>
  );
}
