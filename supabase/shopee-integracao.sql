create table if not exists public.shopee_conexao (
  id integer primary key default 1 check (id = 1),
  shop_id bigint not null,
  access_token text not null,
  refresh_token text not null,
  expira_em timestamptz not null,
  atualizado_em timestamptz not null default now()
);

create table if not exists public.shopee_categoria_mapeamento (
  categoria_id uuid primary key references public.categorias(id) on delete cascade,
  shopee_category_id bigint not null,
  shopee_category_name text not null,
  atualizado_em timestamptz not null default now()
);

create table if not exists public.shopee_produtos (
  produto_id uuid primary key references public.produtos(id) on delete cascade,
  shopee_item_id bigint unique,
  status text not null default 'pendente',
  ultimo_erro text,
  atualizado_em timestamptz not null default now()
);

alter table public.shopee_conexao enable row level security;
alter table public.shopee_categoria_mapeamento enable row level security;
alter table public.shopee_produtos enable row level security;
