-- Execute uma única vez no SQL Editor do Supabase.
-- Permite que o próprio produto seja a primeira opção quando houver variações.

alter table public.produtos
  add column if not exists opcao_principal_nome text;

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

    -- A opção principal usa o estoque do próprio produto.
    update public.produtos as produto
    set quantidade = greatest(0, coalesce(produto.quantidade, 0) - item.quantidade)
    from (
      select produto_id, sum(quantidade)::integer as quantidade
      from public.pedido_itens
      where pedido_id = p_pedido_id and variacao_id is null
      group by produto_id
    ) as item
    where produto.id::text = item.produto_id;

    -- As alternativas usam o estoque individual de cada variação.
    update public.produto_variacoes as variacao
    set quantidade = greatest(0, variacao.quantidade - item.quantidade),
        atualizado_em = now()
    from (
      select variacao_id, sum(quantidade)::integer as quantidade
      from public.pedido_itens
      where pedido_id = p_pedido_id and variacao_id is not null
      group by variacao_id
    ) as item
    where variacao.id = item.variacao_id;
  end if;
end;
$$;

revoke all on function public.confirmar_pagamento_virella(uuid, text, timestamptz) from public;
grant execute on function public.confirmar_pagamento_virella(uuid, text, timestamptz) to service_role;
