"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import styles from "./HeaderAccount.module.css";

export default function HeaderAccount() {
  const pathname = usePathname();
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let mounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (mounted) setUser(data.user ?? null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (mounted) setUser(session?.user ?? null);
      }
    );

    function refreshAccount() {
      supabase.auth.getUser().then(({ data }) => {
        if (mounted) setUser(data.user ?? null);
      });
    }

    window.addEventListener("virella:account-updated", refreshAccount);

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
      window.removeEventListener("virella:account-updated", refreshAccount);
    };
  }, []);

  if (user === undefined) {
    return <span className={styles.loading} aria-label="Verificando conta" />;
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className={`${styles.loginLink} ${pathname === "/login" ? styles.active : ""}`}
      >
        Entrar
      </Link>
    );
  }

  const fullName = user.user_metadata?.nome?.trim() || "Cliente";
  const firstName = fullName.split(/\s+/)[0];

  return (
    <Link
      href="/minha-conta"
      className={`${styles.accountLink} ${pathname === "/minha-conta" ? styles.active : ""}`}
      title="Abrir minha conta"
    >
      <span className={styles.statusDot} aria-hidden="true" />
      <span className={styles.accountText}>
        <strong>Olá, {firstName}</strong>
        <small>Minha conta</small>
      </span>
    </Link>
  );
}
