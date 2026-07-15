"use client";
import { useState } from "react";
import { addToCart } from "@/lib/carrinho";
export default function AddToCartButton({ product }) {
  const [added, setAdded] = useState(false);
  return <button className="addToCartButton" onClick={() => { addToCart(product); setAdded(true); setTimeout(() => setAdded(false), 1600); }}>{added ? "Adicionado ao carrinho" : "Adicionar ao carrinho"}</button>;
}
