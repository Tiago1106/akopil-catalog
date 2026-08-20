---
name: notion-sync
description: Comportamento do sync Notion → Supabase do Akopil — full resync, upsert, nunca hard delete. Ler antes de tocar na rota de sync, no schema de products, ou no painel /admin.
---

# Sync Notion → Supabase — Akopil

Fonte de verdade: [`docs/akopil-database.md`](../../../docs/akopil-database.md) (seções 4 a 10).

## Papel de cada sistema

- **Notion** = interface de cadastro. Nunca é lido em produção pelo site.
- **Supabase (Postgres + Storage)** = banco de verdade que o site lê. Toda listagem, filtro, paginação e página de produto consultam só o Supabase.

O sync só roda quando alguém aperta "Sincronizar produtos" no `/admin` — nunca automático, nunca no caminho de requisição do site público.

## O que a rota de sync faz, nessa ordem

1. Autenticação obrigatória (rota só acessível logado via Supabase Auth).
2. Busca **todos** os produtos da database do Notion, paginado (a API do Notion devolve no máximo 100 por página — percorrer todas as páginas).
3. Para cada produto: extrai campos (nome, preço, material, tags, descrição, `Ativo`, `Best Seller`, URLs temporárias das fotos), baixa cada imagem da URL temporária do Notion e sobe para `product-images/{notion_page_id}/{n}.jpg` no Storage, sobrescrevendo o que já existir.
4. Faz **upsert** na tabela `products` usando `notion_page_id` como chave de conflito.
5. Qualquer produto que não apareceu na busca (removido do Notion) ou veio com `Ativo` desmarcado é marcado `active = false` — nunca deletado.
6. Dispara `revalidatePath` nas rotas afetadas (home e página de produto) ao final.

## Regras que não podem ser quebradas

- **Sempre full resync, nunca incremental.** Não implementar detecção de "o que mudou" — buscar a database inteira do Notion a cada sync é a decisão. Resync completo também corrige qualquer edição manual feita direto no Supabase.
- **Nunca `DELETE` na tabela `products`.** Produto removido ou desativado no Notion vira `active = false`, ponto. O site só lista/mostra `active = true`.
- **`best_seller` é sempre manual**, um checkbox no Notion que entra no sync como qualquer outro campo. Nunca calcular a partir de vendas, popularidade ou qualquer heurística automática.
- **Pasta de imagem = `notion_page_id`, arquivo = posição (`1.jpg`, `2.jpg`...).** Isso permite ao sync sobrescrever direto, sem consultar nada antes e sem precisar comparar hash de imagem.
- `SUPABASE_SECRET_KEY` só pode ser usada dentro da rota de sync (Route Handler / Server Component) — nunca em código client-side.

## Painel `/admin`

- Protegido por Supabase Auth (email/senha, conta única, sem multiusuário, sem OAuth).
- Único botão relevante: "Sincronizar produtos".
- Mostrar resultado do último sync usando o campo `synced_at` (quantos produtos, horário).

## Schema de referência

```sql
create table products (
  id                uuid primary key default gen_random_uuid(),
  notion_page_id    text unique not null,
  slug              text unique not null,
  name              text not null,
  price             numeric not null,
  original_price    numeric,
  material          text,
  description       text,
  tags              text[] default '{}',
  images            text[] default '{}',
  active            boolean not null default true,
  best_seller       boolean not null default false,
  synced_at         timestamptz not null default now(),
  created_at        timestamptz not null default now()
);
```

Esse schema já existe no Supabase — não recriar, só consumir. Qualquer mudança de coluna é decisão nova, perguntar antes.
