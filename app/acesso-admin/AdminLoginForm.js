"use client";

import { useActionState } from "react";
import { loginAdminAction } from "./actions";

export default function AdminLoginForm() {
  const [state, action, pending] = useActionState(loginAdminAction, { error: "" });

  return (
    <form action={action} className="adminGateForm">
      <label>
        Senha administrativa
        <input name="senha" type="password" required autoFocus autoComplete="current-password" />
      </label>

      {state?.error && <p>{state.error}</p>}

      <button type="submit" disabled={pending}>
        {pending ? "Verificando..." : "Acessar painel"}
      </button>
    </form>
  );
}
