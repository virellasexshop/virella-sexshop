"use client";

import { useActionState } from "react";
import { importProductsAction } from "./actions";

const initialState = {
  ok: null,
  message: "",
  errors: [],
};

export default function ImportProductsForm() {
  const [state, action, pending] = useActionState(importProductsAction, initialState);

  return (
    <form action={action} className="adminImportForm">
      <label className="adminFileDrop">
        <span>Arquivo CSV</span>
        <strong>Escolher planilha</strong>
        <small>Até 1.500 produtos e 900 KB por arquivo</small>
        <input name="arquivo" type="file" accept=".csv,text/csv" required />
      </label>

      <div className="adminImportRules">
        <div><span>01</span><p><strong>Nome, categoria e preço</strong> são obrigatórios.</p></div>
        <div><span>02</span><p>Categorias novas são <strong>criadas automaticamente</strong>.</p></div>
        <div><span>03</span><p>Produtos com o mesmo <strong>SKU são atualizados</strong>.</p></div>
        <div><span>04</span><p>Imagens devem ser informadas como <strong>URL pública</strong>.</p></div>
      </div>

      {state.message && (
        <div className={state.ok ? "adminImportResult success" : "adminImportResult error"}>
          <strong>{state.message}</strong>
          {state.ok && (
            <div className="adminImportStats">
              <span><b>{state.inserted}</b> criados</span>
              <span><b>{state.updated}</b> atualizados</span>
              <span><b>{state.ignored}</b> ignorados</span>
            </div>
          )}
          {state.errors?.length > 0 && (
            <ul>{state.errors.map((error) => <li key={error}>{error}</li>)}</ul>
          )}
        </div>
      )}

      <button type="submit" className="adminButton" disabled={pending}>
        {pending ? "Importando..." : "Importar produtos"}
      </button>
    </form>
  );
}
