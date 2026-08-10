-- Correção para contas em que o Mercado Livre não retorna refresh_token no primeiro grant.
-- Execute uma vez no SQL Editor do Supabase correto.

alter table public.mercado_livre_contas
  alter column refresh_token drop not null;
