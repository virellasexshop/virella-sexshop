"use client";

import { deleteProductAction } from "@/app/admin/produtos/actions";

export default function ProductDeleteButton({ productId, productName }) {
  function confirmDelete(event) {
    const confirmed = window.confirm(
      `Excluir "${productName}" permanentemente? Esta ação não pode ser desfeita.`
    );

    if (!confirmed) event.preventDefault();
  }

  return (
    <form action={deleteProductAction} onSubmit={confirmDelete}>
      <input type="hidden" name="produto_id" value={productId} />
      <button type="submit" className="adminRowButton danger">
        Excluir
      </button>
    </form>
  );
}
