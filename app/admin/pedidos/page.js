import AdminSidebar from "@/components/admin/AdminSidebar";
import { getAdminOrders } from "@/modules/orders/order.service";
import { updateOrderStatusAction } from "./actions";
import styles from "./pedidos.module.css";

export const dynamic = "force-dynamic";
const money = (value) => Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const date = (value) => new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
const PAYMENT = { aguardando: "Aguardando", em_analise: "Em análise", aprovado: "Aprovado", recusado: "Recusado", cancelado: "Cancelado", estornado: "Estornado", erro: "Erro" };

export default async function AdminOrdersPage() {
  const orders = await getAdminOrders();
  return <main className="adminShell"><AdminSidebar /><section className="adminContent">
    <div className="adminTop"><div><span className="kicker">Vendas</span><h1>Pedidos</h1></div><span className={styles.counter}>{orders.length} pedidos</span></div>
    {orders.length ? <div className={styles.list}>{orders.map((order) => <article className={styles.card} key={order.id}>
      <header><div><span>Pedido</span><strong>#{order.numero}</strong></div><div><span>Cliente</span><strong>{order.cliente_nome}</strong><small>{order.cliente_email}</small></div><div><span>Pagamento</span><strong className={order.status_pagamento === "aprovado" ? styles.approved : ""}>{PAYMENT[order.status_pagamento] || order.status_pagamento}</strong></div><div><span>Total</span><strong>{money(order.total)}</strong><small>{date(order.criado_em)}</small></div></header>
      <div className={styles.body}><div><h3>Itens</h3><ul>{(order.pedido_itens || []).map((item, index) => <li key={`${item.nome}-${index}`}>{item.quantidade}× {item.nome}</li>)}</ul></div><div><h3>Entrega</h3><p>{order.endereco_rua}, {order.endereco_numero}{order.endereco_complemento ? ` — ${order.endereco_complemento}` : ""}<br />{order.endereco_bairro} — {order.endereco_cidade}/{order.endereco_estado}<br />CEP {order.endereco_cep}</p></div><form action={updateOrderStatusAction}><input type="hidden" name="pedido_id" value={order.id} /><label>Andamento<select name="status_pedido" defaultValue={order.status_pedido}><option value="novo">Pedido recebido</option><option value="em_separacao">Em separação</option><option value="enviado">Enviado</option><option value="entregue">Entregue</option><option value="cancelado">Cancelado</option></select></label><button type="submit">Atualizar</button></form></div>
    </article>)}</div> : <div className="adminPanel"><h2>Nenhum pedido recebido</h2><p>Os pedidos aparecerão aqui assim que o checkout for utilizado.</p></div>}
  </section></main>;
}
