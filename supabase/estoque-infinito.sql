-- Execute uma única vez no SQL Editor do Supabase.
-- Mantém os produtos sempre disponíveis e deixa de baixar estoque após o pagamento.

create or replace function public.confirmar_pagamento_virella(
  p_pedido_id uuid,
  p_pagamento_id text,
  p_pago_em timestamptz
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  status_atual text;
begin
  select status_pagamento into status_atual
  from public.pedidos
  where id = p_pedido_id
  for update;

  if status_atual is null then
    raise exception 'Pedido não encontrado';
  end if;

  if status_atual <> 'aprovado' then
    update public.pedidos
    set status_pagamento = 'aprovado',
        mercado_pago_pagamento_id = p_pagamento_id,
        pago_em = coalesce(p_pago_em, now()),
        atualizado_em = now()
    where id = p_pedido_id;
  end if;
end;
$$;

revoke all on function public.confirmar_pagamento_virella(uuid, text, timestamptz) from public;
grant execute on function public.confirmar_pagamento_virella(uuid, text, timestamptz) to service_role;
