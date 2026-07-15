# Prazer Discreto — versão corrigida

Esta entrega corrige as páginas vazias que causavam o erro "default export is not a React Component" e inclui:

- catálogo premium com busca, categorias e ordenação;
- páginas dinâmicas de categoria;
- página individual de produto;
- carrinho persistido no navegador;
- login e cadastro com Supabase Auth;
- área do cliente e logout;
- checkout preparado para a futura integração Mercado Pago;
- visual responsivo.

## Instalação

1. Extraia esta pasta em um local novo. Não misture com a pasta antiga.
2. Copie o seu `.env.local` antigo para a raiz desta pasta.
3. Execute `npm install`.
4. Execute `npm run dev`.

## Supabase Auth

No Supabase, mantenha Email habilitado em Authentication > Providers. Se a confirmação de e-mail estiver ativada, o cliente precisará confirmar o cadastro antes do primeiro login.

## Observação

O checkout real com Mercado Pago ainda exige credenciais, criação de preferência, webhook e regras de pedido/estoque. A tela está preparada, mas não processa pagamento real nesta entrega.
