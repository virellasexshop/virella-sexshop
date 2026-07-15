"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getCart, saveCart } from "@/lib/carrinho";
const money = (value) => Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export default function CartClient() {
  const [items, setItems] = useState([]);
  useEffect(() => { const timer = window.setTimeout(() => setItems(getCart()), 0); return () => window.clearTimeout(timer); }, []);
  function update(next) { setItems(next); saveCart(next); }
  function quantity(id, delta) { update(items.map((item) => item.id === id ? { ...item, quantidade: Math.max(1, item.quantidade + delta) } : item)); }
  function remove(id) { update(items.filter((item) => item.id !== id)); }
  const subtotal = items.reduce((total, item) => total + item.preco * item.quantidade, 0);
  if (!items.length) return <div className="emptyCart"><h2>Seu carrinho está vazio.</h2><p>Descubra uma curadoria pensada para você.</p><Link href="/catalogo">Explorar catálogo</Link></div>;
  return <div className="cartLayout"><div className="cartItems">{items.map((item) => <article key={item.id} className="cartItem">{item.imagem_principal ? <img src={item.imagem_principal} alt={item.nome} /> : <div className="cartThumb" />}<div className="cartItemInfo"><span>Produto selecionado</span><h2>{item.nome}</h2><strong>{money(item.preco)}</strong></div><div className="cartQuantity"><button onClick={() => quantity(item.id, -1)}>−</button><span>{item.quantidade}</span><button onClick={() => quantity(item.id, 1)}>+</button></div><button className="cartRemove" onClick={() => remove(item.id)}>Remover</button></article>)}</div><aside className="cartSummary"><span>Resumo</span><div><p>Subtotal</p><strong>{money(subtotal)}</strong></div><div><p>Entrega</p><strong>Calculada no checkout</strong></div><div className="cartTotal"><p>Total</p><strong>{money(subtotal)}</strong></div><Link href="/checkout">Continuar para checkout</Link><small>Pagamento seguro e embalagem totalmente discreta.</small></aside></div>;
}
