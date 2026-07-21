"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { cartItemKey, getCart, saveCart } from "@/lib/carrinho";
const money = (value) => Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export default function CartClient() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      const current = getCart();
      setItems(current);

      if (current.length) {
        fetch("/api/produtos/precos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: current }),
        })
          .then((response) => response.json())
          .then(({ products = [] }) => {
            if (!active) return;
            const priceMap = new Map(products.map((product) => [
              cartItemKey(product.id, product.variacao_id),
              product,
            ]));
            const updated = current.map((item) => ({
              ...item,
              ...(priceMap.get(item.cart_key) || {}),
            }));
            setItems(updated);
            saveCart(updated);
          })
          .catch(() => {});
      }
    }, 0);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, []);
  function update(next) { setItems(next); saveCart(next); }
  function quantity(key, delta) { update(items.map((item) => item.cart_key === key ? { ...item, quantidade: Math.max(1, item.quantidade + delta) } : item)); }
  function remove(key) { update(items.filter((item) => item.cart_key !== key)); }
  const subtotal = items.reduce((total, item) => total + item.preco * item.quantidade, 0);
  if (!items.length) return <div className="emptyCart"><h2>Seu carrinho está vazio.</h2><p>Descubra uma curadoria pensada para você.</p><Link href="/catalogo">Explorar catálogo</Link></div>;
  return <div className="cartLayout"><div className="cartItems">{items.map((item) => <article key={item.cart_key} className="cartItem">{item.imagem_principal ? <img src={item.imagem_principal} alt={item.nome} /> : <div className="cartThumb" />}<div className="cartItemInfo"><span>Produto selecionado</span><h2>{item.nome}</h2>{item.variacao_nome && <small>Opção: {item.variacao_nome}</small>}<strong>{money(item.preco)}</strong></div><div className="cartQuantity"><button onClick={() => quantity(item.cart_key, -1)}>−</button><span>{item.quantidade}</span><button onClick={() => quantity(item.cart_key, 1)}>+</button></div><button className="cartRemove" onClick={() => remove(item.cart_key)}>Remover</button></article>)}</div><aside className="cartSummary"><span>Resumo</span><div><p>Subtotal</p><strong>{money(subtotal)}</strong></div><div><p>Entrega</p><strong>Calculada no checkout</strong></div><div className="cartTotal"><p>Total</p><strong>{money(subtotal)}</strong></div><Link href="/checkout">Continuar para checkout</Link><small>Pagamento seguro e embalagem totalmente discreta.</small></aside></div>;
}
