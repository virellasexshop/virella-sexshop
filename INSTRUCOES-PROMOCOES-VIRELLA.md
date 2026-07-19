# Central de promoções Virella

## 1. Preparar o Supabase

Antes de abrir a página de promoções, acesse **Supabase → SQL Editor**, cole todo o conteúdo de `supabase/promocoes.sql` e clique em **Run**.

Esse SQL cria apenas a configuração da campanha global. Ele não altera os preços dos produtos existentes.

## 2. Instalar os arquivos

Copie as pastas da atualização para a raiz do projeto, mescle as pastas e confirme a substituição dos arquivos.

Exclua `.next` e execute:

```bash
npm run dev
```

## 3. Usar

Acesse `/admin/promocoes`.

### Promoção individual

Informe o preço promocional, marque a promoção como ativa e salve. Ao desmarcar e salvar, o produto volta automaticamente ao preço original. O preço promocional fica guardado para ser reutilizado depois.

### Encerrar todas

Clique em **Encerrar todas as individuais**. Os produtos voltam aos preços originais sem apagar os valores promocionais cadastrados.

### Site inteiro

Informe o percentual, marque **Campanha ativa** e salve. Exemplo: um produto de R$ 200 com 5% OFF será exibido por R$ 190. Ao desligar, volta para R$ 200.

Se um produto tiver uma promoção individual melhor que a global, o site usa o menor preço.
