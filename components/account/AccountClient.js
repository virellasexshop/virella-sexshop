"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function AccountClient() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [router]);

  async function logout() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.location.assign("/");
  }

  if (loading) return <p>Carregando sua conta...</p>;

  return (
    <div className="accountCard">
      <span>Conta ativa</span>
      <h2>{user?.user_metadata?.nome || "Cliente Virella Sexshop"}</h2>
      <p>{user?.email}</p>
      <button type="button" onClick={logout}>Sair da conta</button>
    </div>
  );
}