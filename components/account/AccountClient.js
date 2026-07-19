"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import styles from "./AccountClient.module.css";

function formatDate(value) {
  if (!value) return "Não informado";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export default function AccountClient() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    const supabase = createSupabaseBrowserClient();

    supabase.auth.getUser().then(({ data, error }) => {
      if (!active) return;

      if (error || !data.user) {
        router.replace("/login");
        return;
      }

      setUser(data.user);
      setName(data.user.user_metadata?.nome || "");
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [router]);

  async function updateName(event) {
    event.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) return;

    setSaving(true);
    setMessage("");

    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase.auth.updateUser({
      data: { ...user.user_metadata, nome: cleanName },
    });

    if (error) {
      setMessage("Não foi possível salvar. Tente novamente.");
    } else {
      setUser(data.user);
      setMessage("Nome atualizado com sucesso.");
      window.dispatchEvent(new Event("virella:account-updated"));
    }

    setSaving(false);
  }

  async function logout() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.location.assign("/");
  }

  if (loading) return <p className={styles.loading}>Carregando sua conta...</p>;

  return (
    <section className={styles.accountGrid}>
      <div className={styles.profileCard}>
        <div className={styles.profileTop}>
          <span className={styles.avatar} aria-hidden="true">
            {(user?.user_metadata?.nome || user?.email || "V").charAt(0).toUpperCase()}
          </span>
          <div>
            <span className={styles.activeLabel}>● Conta ativa</span>
            <h2>{user?.user_metadata?.nome || "Cliente Virella"}</h2>
            <p>{user?.email}</p>
          </div>
        </div>

        <form className={styles.nameForm} onSubmit={updateName}>
          <label htmlFor="account-name">Nome de exibição</label>
          <div>
            <input
              id="account-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
              maxLength={80}
              required
            />
            <button type="submit" disabled={saving}>
              {saving ? "Salvando..." : "Salvar nome"}
            </button>
          </div>
          {message && <p className={styles.message}>{message}</p>}
        </form>
      </div>

      <aside className={styles.detailsCard}>
        <span className={styles.sectionLabel}>Informações da conta</span>
        <dl>
          <div>
            <dt>E-mail</dt>
            <dd>{user?.email}</dd>
          </div>
          <div>
            <dt>Verificação</dt>
            <dd>{user?.email_confirmed_at ? "E-mail confirmado" : "Pendente"}</dd>
          </div>
          <div>
            <dt>Cliente desde</dt>
            <dd>{formatDate(user?.created_at)}</dd>
          </div>
          <div>
            <dt>Último acesso</dt>
            <dd>{formatDate(user?.last_sign_in_at)}</dd>
          </div>
        </dl>
        <button type="button" className={styles.logoutButton} onClick={logout}>
          Sair da conta
        </button>
      </aside>
    </section>
  );
}
