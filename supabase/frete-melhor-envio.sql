-- Execute este arquivo UMA VEZ no SQL Editor do Supabase.
-- Ele pode ser executado novamente sem duplicar colunas.

alter table public.produtos
  add column if not exists peso_kg numeric(10,3) not null default 0.300,
  add column if not exists altura_cm numeric(10,2) not null default 8,
  add column if not exists largura_cm numeric(10,2) not null default 12,
  add column if not exists comprimento_cm numeric(10,2) not null default 18;

alter table public.pedidos
  add column if not exists frete_servico_id text,
  add column if not exists frete_servico_nome text,
  add column if not exists frete_transportadora text,
  add column if not exists frete_prazo_dias integer,
  add column if not exists frete_preco_original numeric(12,2),
  add column if not exists frete_gratis boolean not null default false;

comment on column public.produtos.peso_kg is
  'Peso unitário do produto protegido para envio, em quilogramas.';
comment on column public.produtos.altura_cm is
  'Altura unitária do produto protegido para envio, em centímetros.';
comment on column public.produtos.largura_cm is
  'Largura unitária do produto protegido para envio, em centímetros.';
comment on column public.produtos.comprimento_cm is
  'Comprimento unitário do produto protegido para envio, em centímetros.';

select 'Frete Melhor Envio instalado' as resultado;
