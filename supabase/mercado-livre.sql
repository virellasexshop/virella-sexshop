-- Integração Virella <-> Mercado Livre
-- Execute uma única vez no SQL Editor do Supabase do projeto da loja.

create extension if not exists pgcrypto;

create table if not exists public.mercado_livre_contas (
  id uuid primary key default gen_random_uuid(),
  site_id text not null default 'MLB',
  seller_id text not null unique,
  nickname text,
  access_token text not null,
  refresh_token text not null,
  token_expires_at timestamptz not null,
  scope text,
  conectado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.mercado_livre_produtos (
  produto_id uuid primary key references public.produtos(id) on delete cascade,
  ml_item_id text unique,
  ml_permalink text,
  category_id text,
  listing_type_id text,
  condition text not null default 'new',
  ml_title text,
  ml_price numeric(12,2),
  available_quantity integer,
  variation_attribute_id text,
  attributes jsonb not null default '{}'::jsonb,
  status text not null default 'draft',
  last_error text,
  sincronizado_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists mercado_livre_produtos_item_idx
  on public.mercado_livre_produtos(ml_item_id);

-- Tokens OAuth ficam acessíveis somente pelo servidor usando SERVICE_ROLE_KEY.
alter table public.mercado_livre_contas enable row level security;
alter table public.mercado_livre_produtos enable row level security;

revoke all on table public.mercado_livre_contas from anon, authenticated;
revoke all on table public.mercado_livre_produtos from anon, authenticated;
