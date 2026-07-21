-- Execute este arquivo uma única vez no SQL Editor do Supabase.
-- Adiciona galeria, variações opcionais e baixa de estoque por variação.

create extension if not exists pgcrypto;

create table if not exists public.produto_imagens (
  id uuid primary key default gen_random_uuid(),
  produto_id uuid not null references public.produtos(id) on delete cascade,
  url text not null,
  ordem integer not null default 0 check (ordem >= 0),
  criado_em timestamptz not null default now()
);

create table if not exists public.produto_variacoes (
  id uuid primary key default gen_random_uuid(),
  produto_id uuid not null references public.produtos(id) on delete cascade,
  nome text not null check (char_length(trim(nome)) between 1 and 100),
  sku text,
  preco numeric(12,2) check (preco is null or preco >= 0),
  quantidade integer not null default 0 check (quantidade >= 0),
  imagem_url text,
  ativo boolean not null default true,
  ordem integer not null default 0 check (ordem >= 0),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists produto_imagens_produto_id_idx
  on public.produto_imagens(produto_id, ordem);
create index if not exists produto_variacoes_produto_id_idx
  on public.produto_variacoes(produto_id, ordem);
create unique index if not exists produto_variacoes_sku_unique_idx
  on public.produto_variacoes(sku)
  where sku is not null and trim(sku) <> '';

alter table public.produto_imagens enable row level security;
alter table public.produto_variacoes enable row level security;

alter table public.pedido_itens
  add column if not exists variacao_id uuid,
  add column if not exists variacao_nome text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'pedido_itens_variacao_id_fkey'
      and conrelid = 'public.pedido_itens'::regclass
  ) then
    alter table public.pedido_itens
      add constraint pedido_itens_variacao_id_fkey
      foreign key (variacao_id)
      references public.produto_variacoes(id)
      on delete restrict;
  end if;
end $$;

create index if not exists pedido_itens_variacao_id_idx
  on public.pedido_itens(variacao_id);

-- Confirma o pagamento e baixa o estoque correto uma única vez.
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

    -- Produtos sem variação continuam usando o estoque principal.
    update public.produtos as produto
    set quantidade = greatest(0, coalesce(produto.quantidade, 0) - item.quantidade)
    from (
      select produto_id, sum(quantidade)::integer as quantidade
      from public.pedido_itens
      where pedido_id = p_pedido_id and variacao_id is null
      group by produto_id
    ) as item
    where produto.id::text = item.produto_id;

    -- Produtos com variação baixam o estoque da opção escolhida.
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

    -- Mantém o total exibido no produto sincronizado com suas variações.
    update public.produtos as produto
    set quantidade = estoque.total
    from (
      select produto_id, sum(quantidade)::integer as total
      from public.produto_variacoes
      where ativo = true
      group by produto_id
    ) as estoque
    where produto.id = estoque.produto_id
      and produto.id::text in (
        select produto_id
        from public.pedido_itens
        where pedido_id = p_pedido_id and variacao_id is not null
      );
  end if;
end;
$$;

revoke all on function public.confirmar_pagamento_virella(uuid, text, timestamptz) from public;
grant execute on function public.confirmar_pagamento_virella(uuid, text, timestamptz) to service_role;
