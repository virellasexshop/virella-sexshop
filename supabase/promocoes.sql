create table if not exists public.configuracoes_promocao (
  id text primary key,
  promocao_global_ativa boolean not null default false,
  desconto_global_percentual numeric(5,2) not null default 0
    check (desconto_global_percentual >= 0 and desconto_global_percentual < 100),
  atualizado_em timestamptz not null default now()
);

insert into public.configuracoes_promocao (
  id,
  promocao_global_ativa,
  desconto_global_percentual
) values (
  'principal',
  false,
  0
) on conflict (id) do nothing;

alter table public.configuracoes_promocao enable row level security;
