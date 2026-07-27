-- Execute este arquivo uma única vez no SQL Editor do Supabase.
create extension if not exists pgcrypto;

create table if not exists public.avaliacoes (
  id uuid primary key default gen_random_uuid(),
  produto_id uuid not null references public.produtos(id) on delete cascade,
  usuario_id uuid not null references auth.users(id) on delete cascade,
  nome_exibicao text not null check (char_length(nome_exibicao) between 2 and 60),
  nota smallint not null check (nota between 1 and 5),
  comentario text not null check (char_length(comentario) between 10 and 700),
  compra_verificada boolean not null default false,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (produto_id, usuario_id)
);

create index if not exists avaliacoes_produto_id_idx
  on public.avaliacoes(produto_id, ativo, criado_em desc);

create or replace function public.validar_avaliacao_virella()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  comprador uuid;
  possui_compra boolean;
begin
  comprador := auth.uid();

  if comprador is null or new.usuario_id <> comprador then
    raise exception 'Usuário inválido para esta avaliação';
  end if;

  select exists (
    select 1
    from public.pedidos p
    join public.pedido_itens pi on pi.pedido_id = p.id
    where p.usuario_id = comprador
      and p.status_pagamento = 'aprovado'
      and pi.produto_id::text = new.produto_id::text
  ) into possui_compra;

  if not possui_compra then
    raise exception 'É necessário possuir uma compra aprovada deste produto';
  end if;

  new.compra_verificada := true;
  new.ativo := true;
  new.atualizado_em := now();
  return new;
end;
$$;

drop trigger if exists validar_avaliacao_virella_trigger on public.avaliacoes;
create trigger validar_avaliacao_virella_trigger
before insert or update of nome_exibicao, nota, comentario
on public.avaliacoes
for each row execute function public.validar_avaliacao_virella();

alter table public.avaliacoes enable row level security;

drop policy if exists "Avaliacoes publicas visiveis" on public.avaliacoes;
create policy "Avaliacoes publicas visiveis"
on public.avaliacoes for select
to anon, authenticated
using (ativo = true);

drop policy if exists "Cliente cria a propria avaliacao" on public.avaliacoes;
create policy "Cliente cria a propria avaliacao"
on public.avaliacoes for insert
to authenticated
with check (auth.uid() = usuario_id);

drop policy if exists "Cliente atualiza a propria avaliacao" on public.avaliacoes;
create policy "Cliente atualiza a propria avaliacao"
on public.avaliacoes for update
to authenticated
using (auth.uid() = usuario_id)
with check (auth.uid() = usuario_id);

drop policy if exists "Cliente exclui a propria avaliacao" on public.avaliacoes;
create policy "Cliente exclui a propria avaliacao"
on public.avaliacoes for delete
to authenticated
using (auth.uid() = usuario_id);

revoke all on function public.validar_avaliacao_virella() from public;
grant execute on function public.validar_avaliacao_virella() to authenticated;
