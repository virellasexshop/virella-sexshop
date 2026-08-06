-- Execute UMA VEZ no SQL Editor do Supabase antes de publicar a integração de etiquetas.

alter table public.pedidos
  add column if not exists cliente_documento text,
  add column if not exists frete_pacotes jsonb not null default '[]'::jsonb,
  add column if not exists frete_etiqueta_id text,
  add column if not exists frete_etiqueta_url text,
  add column if not exists frete_etiqueta_status text,
  add column if not exists frete_etiqueta_erro text,
  add column if not exists frete_etiqueta_gerada_em timestamptz,
  add column if not exists frete_nota_fiscal_chave text;

create index if not exists pedidos_frete_etiqueta_id_idx
  on public.pedidos (frete_etiqueta_id)
  where frete_etiqueta_id is not null;

select 'Integração de etiquetas do Melhor Envio instalada' as resultado;
