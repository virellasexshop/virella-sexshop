"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function AuthForm({ mode, redirectTo = "" }) {
  const isRegister = mode === "register";
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const supabase = createSupabaseBrowserClient();
      if (isRegister) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { nome: name } },
        });
        if (error) throw error;
        if (!data.session) {
          setMessage("Cadastro realizado. Verifique seu e-mail para confirmar a conta.");
        } else {
          router.push(redirectTo || "/minha-conta");
          router.refresh();
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push(redirectTo || "/minha-conta");
        router.refresh();
      }
    } catch (error) {
      setMessage(error?.message || "Não foi possível concluir. Confira os dados e tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="authPanel">
      <div className="authPanelHeader">
        <span>{isRegister ? "Nova conta" : "Bem-vindo de volta"}</span>
        <h2>{isRegister ? "Cadastre-se" : "Entrar"}</h2>
      </div>
      <form onSubmit={handleSubmit} className="authForm">
        {isRegister && (
          <label>
            <span>Nome</span>
            <input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Seu nome" autoComplete="name" />
          </label>
        )}
        <label>
          <span>E-mail</span>
          <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="voce@exemplo.com" autoComplete="email" />
        </label>
        <label>
          <span>Senha</span>
          <input required minLength={6} type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Mínimo de 6 caracteres" autoComplete={isRegister ? "new-password" : "current-password"} />
        </label>
        {message && <p className="authMessage">{message}</p>}
        <button className="authSubmit" disabled={loading}>{loading ? "Aguarde..." : isRegister ? "Criar minha conta" : "Entrar com segurança"}</button>
      </form>
      <p className="authSwitch">
        {isRegister ? "Já possui uma conta?" : "Ainda não possui uma conta?"}{" "}
        <Link href={`${isRegister ? "/login" : "/cadastro"}${redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`}>
          {isRegister ? "Entrar" : "Cadastre-se"}
        </Link>
      </p>
    </section>
  );
}
