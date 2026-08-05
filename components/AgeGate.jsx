"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import styles from "./AgeGate.module.css";

const STORAGE_KEY = "virella_age_verified";

export default function AgeGate() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // O painel administrativo não precisa exibir a confirmação de idade.
    if (pathname?.startsWith("/admin")) {
      setIsOpen(false);
      return;
    }

    const verified = window.localStorage.getItem(STORAGE_KEY) === "true";
    setIsOpen(!verified);
  }, [pathname]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  function confirmAdult() {
    window.localStorage.setItem(STORAGE_KEY, "true");
    setIsOpen(false);
  }

  function denyAccess() {
    window.location.replace("https://www.google.com/");
  }

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="age-gate-title">
      <div className={styles.card}>
        <div className={styles.logoMark} aria-hidden="true">V</div>
        <p className={styles.brand}>VIRELLA SEX SHOP</p>

        <h1 id="age-gate-title" className={styles.title}>
          Você tem 18 anos ou mais?
        </h1>

        <p className={styles.description}>
          Este site contém produtos destinados exclusivamente a pessoas maiores de 18 anos.
          Confirme sua idade para continuar.
        </p>

        <div className={styles.actions}>
          <button type="button" className={styles.primaryButton} onClick={confirmAdult} autoFocus>
            Sim, sou maior de 18 anos
          </button>

          <button type="button" className={styles.secondaryButton} onClick={denyAccess}>
            Não, sou menor de 18 anos
          </button>
        </div>

        <p className={styles.legal}>
          Ao continuar, você declara ter idade legal para acessar este conteúdo.
        </p>
      </div>
    </div>
  );
}
