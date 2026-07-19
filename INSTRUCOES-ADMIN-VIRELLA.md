# Administração rápida — Virella

## Instalação

Copie as pastas do ZIP para a pasta principal do projeto e confirme a substituição dos arquivos.

Depois, faça commit e envie ao GitHub para a Vercel publicar a atualização.

## Configuração obrigatória na Vercel

Abra o projeto na Vercel e acesse **Settings → Environment Variables**.

Crie estas duas variáveis para Production, Preview e Development:

- `ADMIN_PASSWORD`: a senha que você usará para entrar no painel.
- `ADMIN_SESSION_SECRET`: uma sequência aleatória longa, com pelo menos 32 caracteres.

Após salvar, faça um novo deploy.

## Endereços

- Acesso protegido: `/acesso-admin`
- Painel: `/admin`
- Categorias: `/admin/categorias`
- Novo produto: `/admin/produtos/novo`
- Importar planilha: `/admin/produtos/importar`

## Importação

Na página **Importar planilha**, clique em **Baixar modelo**. Preencha o CSV mantendo os nomes das colunas.

Regras:

- `nome`, `categoria` e `preco` são obrigatórios.
- Categorias que não existirem serão criadas automaticamente.
- Se um SKU já existir, o produto correspondente será atualizado.
- Sem SKU correspondente, será criado um produto novo.
- A coluna `imagem_url` deve conter um endereço público da imagem.
- Aceita CSV separado por vírgula ou ponto e vírgula.
- Cada arquivo aceita até 1.500 produtos e 900 KB.

## Antes de testar localmente

Adicione as duas variáveis ao `.env.local`, pare o servidor, exclua a pasta `.next` e execute:

```bash
npm run dev
```
