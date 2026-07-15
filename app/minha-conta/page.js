"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
export default function MinhaContaPage() {
  const router = useRouter(); const [user, setUser] = useState(null); const [loading, setLoading] = useState(true);
  useEffect(() => { const supabase = createSupabaseBrowserClient(); supabase.auth.getUser().then(({ data }) => { if (!data.user) router.replace("/login"); else setUser(data.user); setLoading(false); }); }, [router]);
  async function logout() { await createSupabaseBrowserClient().auth.signOut(); router.push("/"); router.refresh(); }
  return <><Header /><main className="accountPage container"><span className="eyebrow">Área do cliente</span><h1>Minha conta</h1>{loading ? <p>Carregando...</p> : user && <div className="accountCard"><span>Conta ativa</span><h2>{user.user_metadata?.nome || "Cliente Virella Sexshop"}</h2><p>{user.email}</p><button onClick={logout}>Sair da conta</button></div>}</main><Footer /></>;
}
