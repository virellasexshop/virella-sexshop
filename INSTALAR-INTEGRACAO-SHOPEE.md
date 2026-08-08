# Integração direta Virella + Shopee

## 1. Criar o aplicativo na Shopee Open Platform
A integração oficial exige um aplicativo aprovado na Shopee Open Platform. No aplicativo, cadastre a URL de retorno:

`https://SEU-DOMINIO/api/shopee/auth/callback`

Copie o Partner ID e o Partner Key.

## 2. Supabase
Abra o SQL Editor e execute o arquivo:

`supabase/shopee-integracao.sql`

## 3. Variáveis na Vercel
Adicione:

- `SHOPEE_PARTNER_ID`
- `SHOPEE_PARTNER_KEY`
- `SHOPEE_API_BASE_URL=https://partner.shopeemobile.com`

Não coloque o Partner Key em variável que comece com NEXT_PUBLIC.

## 4. Publicar
Faça o deploy e abra:

`/admin/shopee`

Clique em **Conectar com a Shopee**, autorize a loja, relacione cada categoria da Virella com a categoria correta da Shopee e publique primeiro 1 produto de teste.

## Observações
- A Shopee pode exigir atributos específicos por categoria. Quando a API recusar um produto, o motivo aparecerá na coluna Shopee.
- Produtos sem estoque no site são enviados inicialmente com 100 unidades, seguindo o estoque infinito usado pela Virella.
- Alterações de preço e estoque podem ser reenviadas pelo botão Sincronizar.
