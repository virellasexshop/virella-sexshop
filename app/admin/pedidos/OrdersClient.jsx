"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { updateOrderStatusAction } from "./actions";
import styles from "./pedidos.module.css";

const money = (value) => Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const dateTime = (value) => new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
const PAYMENT = { aguardando: "Aguardando", em_analise: "Em análise", aprovado: "Aprovado", recusado: "Recusado", cancelado: "Cancelado", estornado: "Estornado", erro: "Erro" };

function localDateKey(value) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function todayKey() {
  return localDateKey(new Date());
}

export default function OrdersClient({ orders }) {
  const [filterMode, setFilterMode] = useState("all");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);

  const filteredOrders = useMemo(() => {
    if (filterMode === "today") {
      const today = todayKey();
      return orders.filter((order) => localDateKey(order.criado_em) === today);
    }

    if (filterMode === "date" && selectedDate) {
      return orders.filter((order) => localDateKey(order.criado_em) === selectedDate);
    }

    return orders;
  }, [orders, filterMode, selectedDate]);

  function chooseMode(mode) {
    setFilterMode(mode);
    if (mode !== "date") setSelectedDate("");
  }

  return (
    <>
      <div className={styles.filters}>
        <div className={styles.filterButtons} aria-label="Filtrar pedidos por data">
          <button type="button" className={filterMode === "all" ? styles.activeFilter : ""} onClick={() => chooseMode("all")}>Todos</button>
          <button type="button" className={filterMode === "today" ? styles.activeFilter : ""} onClick={() => chooseMode("today")}>Hoje</button>
          <button type="button" className={filterMode === "date" ? styles.activeFilter : ""} onClick={() => chooseMode("date")}>Escolher data</button>
        </div>

        {filterMode === "date" ? (
          <label className={styles.datePicker}>
            Data do pedido
            <input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
          </label>
        ) : null}

        <span className={styles.resultCount}>{filteredOrders.length} {filteredOrders.length === 1 ? "pedido encontrado" : "pedidos encontrados"}</span>
      </div>

      {filteredOrders.length ? (
        <div className={styles.list}>
          {filteredOrders.map((order) => (
            <article className={styles.card} key={order.id}>
              <header>
                <div><span>Pedido</span><strong>#{order.numero}</strong></div>
                <div><span>Cliente</span><strong>{order.cliente_nome}</strong><small>{order.cliente_email}</small></div>
                <div><span>Pagamento</span><strong className={order.status_pagamento === "aprovado" ? styles.approved : ""}>{PAYMENT[order.status_pagamento] || order.status_pagamento}</strong></div>
                <div><span>Total</span><strong>{money(order.total)}</strong><small>{dateTime(order.criado_em)}</small></div>
              </header>

              <div className={styles.body}>
                <div>
                  <h3>Itens</h3>
                  <ul className={styles.itemsList}>
                    {(order.pedido_itens || []).map((item, index) => (
                      <li key={`${order.id}-${item.nome}-${index}`}>
                        <button type="button" className={styles.itemButton} onClick={() => setSelectedItem({ ...item, orderNumber: order.numero })}>
                          <span className={styles.itemQuantity}>{item.quantidade}×</span>
                          <span>{item.nome}</span>
                          {item.variacao_nome ? <small>{item.variacao_nome}</small> : null}
                          <span className={styles.itemHint}>Ver detalhes</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3>Entrega</h3>
                  <p><strong className={styles.shippingService}>{order.frete_transportadora || "Transportadora"} — {order.frete_servico_nome || "Entrega"}</strong><br />{order.frete_gratis ? "Frete grátis" : money(order.frete)}{order.frete_prazo_dias ? ` · até ${order.frete_prazo_dias} dias úteis` : ""}<br /><br />{order.endereco_rua}, {order.endereco_numero}{order.endereco_complemento ? ` — ${order.endereco_complemento}` : ""}<br />{order.endereco_bairro} — {order.endereco_cidade}/{order.endereco_estado}<br />CEP {order.endereco_cep}</p>
                </div>

                <form action={updateOrderStatusAction}>
                  <input type="hidden" name="pedido_id" value={order.id} />
                  <label>Andamento
                    <select name="status_pedido" defaultValue={order.status_pedido}>
                      <option value="novo">Pedido recebido</option>
                      <option value="em_separacao">Em separação</option>
                      <option value="enviado">Enviado</option>
                      <option value="entregue">Entregue</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                  </label>
                  <button type="submit">Atualizar</button>
                </form>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="adminPanel"><h2>Nenhum pedido encontrado</h2><p>Altere o filtro ou escolha outra data.</p></div>
      )}

      {selectedItem ? (
        <div className={styles.modalBackdrop} role="presentation" onMouseDown={() => setSelectedItem(null)}>
          <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="item-modal-title" onMouseDown={(event) => event.stopPropagation()}>
            <button type="button" className={styles.modalClose} onClick={() => setSelectedItem(null)} aria-label="Fechar">×</button>
            <span className={styles.modalKicker}>Pedido #{selectedItem.orderNumber}</span>
            <h2 id="item-modal-title">Detalhes do item</h2>

            <div className={styles.modalContent}>
              <div className={styles.itemImageWrap}>
                {selectedItem.imagem_url ? (
                  <Image src={selectedItem.imagem_url} alt={selectedItem.nome} fill sizes="(max-width: 600px) 80vw, 320px" className={styles.itemImage} />
                ) : <span>Sem imagem</span>}
              </div>

              <div className={styles.itemDetails}>
                <h3>{selectedItem.nome}</h3>
                {selectedItem.variacao_nome ? <p><span>Opção/variação</span><strong>{selectedItem.variacao_nome}</strong></p> : null}
                <p><span>Quantidade</span><strong>{selectedItem.quantidade}</strong></p>
                <p><span>Preço unitário</span><strong>{money(selectedItem.preco_unitario)}</strong></p>
                <p><span>Total do item</span><strong>{money(selectedItem.total ?? Number(selectedItem.preco_unitario || 0) * Number(selectedItem.quantidade || 0))}</strong></p>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
