"use client";

export default function ConfirmActionButton({
  action,
  fields,
  label = "Excluir",
  message = "Deseja excluir este item permanentemente?",
  className = "",
}) {
  function confirmAction(event) {
    if (!window.confirm(message)) event.preventDefault();
  }

  return (
    <form action={action} onSubmit={confirmAction}>
      {Object.entries(fields || {}).map(([name, value]) => (
        <input type="hidden" name={name} value={String(value)} key={name} />
      ))}
      <button type="submit" className={className}>{label}</button>
    </form>
  );
}
