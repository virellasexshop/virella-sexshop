# Atualização de confiança e avaliações — Virella

Esta atualização adiciona:

- novo texto e argumentos de confiança no hero;
- faixa com quatro benefícios;
- avaliações reais, vinculadas a compras com pagamento aprovado;
- avaliações recentes na página inicial;
- moderação de avaliações no painel administrativo;
- bloco de confiança com WhatsApp, Instagram e políticas;
- páginas de contato, privacidade, entrega, trocas e devoluções.

## 1. Copiar os arquivos

Abra a pasta atual do seu projeto no VS Code. Copie as pastas `app`,
`components`, `modules` e `supabase` deste pacote para a raiz do projeto.
Quando o Windows perguntar, confirme **Substituir os arquivos no destino**.

O pacote contém somente os arquivos relacionados a esta atualização. Ele não
substitui o restante da loja, o checkout ou a integração de frete.

## 2. Criar o sistema de avaliações

No Supabase:

1. Entre no projeto da Virella.
2. Abra **SQL Editor**.
3. Abra o arquivo `supabase/avaliacoes.sql` deste pacote.
4. Copie todo o conteúdo.
5. Cole no SQL Editor e clique em **Run**.

O arquivo deve ser executado somente uma vez.

## 3. Informar CNPJ e razão social

No painel da Vercel, abra:

`Settings > Environment Variables`

Adicione estas variáveis em **Production and Preview**:

```text
NEXT_PUBLIC_VIRELLA_RAZAO_SOCIAL
NEXT_PUBLIC_VIRELLA_CNPJ
```

Use como valores a razão social e o CNPJ reais da empresa. Se ainda não quiser
exibi-los, pode deixar essas variáveis sem cadastrar; o site continuará
funcionando normalmente.

## 4. Enviar para a Vercel

No terminal do VS Code, dentro da pasta do projeto:

```powershell
git add .
git commit -m "Adiciona confianca e avaliacoes verificadas"
git push
```

Se o projeto estiver conectado ao GitHub, a Vercel fará um novo deploy
automaticamente.

## Como funcionam as avaliações

- O cliente precisa estar conectado à conta.
- O cliente precisa ter um pedido pago contendo aquele produto.
- Cada cliente possui uma avaliação por produto.
- Se enviar novamente, a avaliação anterior é atualizada.
- No painel, acesse `/admin/avaliacoes` para ocultar, exibir ou excluir.
- A página inicial mostra somente avaliações verificadas e visíveis.

## Canais configurados

- Instagram: `https://www.instagram.com/virella.intima/`
- WhatsApp: `https://w.app/8oozkx`
