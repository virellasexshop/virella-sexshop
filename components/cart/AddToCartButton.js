"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addToCart } from "@/lib/carrinho";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function AddToCartButton({
  product,
  variation = null,
  disabled = false,
  disabledLabel = "Escolha uma variação",
}) {
  const router = useRouter();
  const [status, setStatus] = useState("idle");

  async function handleAdd() {
    if (disabled || status === "checking") return;

    setStatus("checking");
    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      const returnTo = `${window.location.pathname}${window.location.search}`;
      router.push(`/login?redirect=${encodeURIComponent(returnTo)}`);
      return;
    }

    addToCart(product, 1, variation);
    setStatus("added");
    window.setTimeout(() => setStatus("idle"), 1600);
  }

  const label = disabled
    ? disabledLabel
    : status === "checking"
      ? "Verificando sua conta..."
      : status === "added"
        ? "Adicionado ao carrinho"
        : "Adicionar ao carrinho";

  return (
    <button
      type="button"
      className="addToCartButton"
      onClick={handleAdd}
      disabled={disabled || status === "checking"}
    >
      {label}
    </button>
  );
}
