# Akopil — Data model

Schema já existe no Supabase (criado via script na seção 12 de [akopil-database.md](akopil-database.md)) — este documento descreve o que já está lá, não é um plano de migração.

## Tabela `products`

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

create index products_active_idx on products (active);
create index products_tags_idx on products using gin (tags);
create index products_best_seller_idx on products (best_seller) where best_seller = true;
```

### Campos — notas de uso

| Campo | Notas |
|---|---|
| `notion_page_id` | Chave de ligação com o Notion. Usada como chave de conflito no upsert do sync — é o que evita duplicar produto a cada sincronização. |
| `slug` | Gerado a partir do nome no momento do sync (ex: "Óculos Aviador Preto" → `oculos-aviador-preto`). Usado na URL da página de produto — busca de produto é sempre por `slug`, nunca por `id` na URL pública. |
| `images` | Array de URLs já no Supabase Storage, em ordem — nunca URL do Notion (que expira). Grid de produto é 2×2, então as 4 primeiras posições do array preenchem o grid. |
| `original_price` | `null` quando não há desconto. Quando preenchido, front mostra preço riscado + badge outline "Promoção" (sem cor, ver [design-system.md](design-system.md)). |
| `active` | `false` para produto desativado ou removido no Notion. **Nunca** há `DELETE` na tabela — ver [notion-sync](../.claude/skills/notion-sync/SKILL.md). Toda query pública filtra `active = true`. |
| `best_seller` | Decisão manual, checkbox no Notion, entra no sync como qualquer outro campo. Nunca calculado a partir de vendas/heurística. Alimenta o carrossel "Mais vendidos" da home. |
| `synced_at` | Atualizado a cada upsert. Usado no `/admin` para mostrar quando foi o último sync. |

## Supabase Storage — bucket `product-images`

Bucket público, organizado por produto:

```
product-images/
  {notion_page_id}/
    1.jpg
    2.jpg
    3.jpg
    4.jpg
```

Usar `notion_page_id` como nome de pasta (em vez de um id aleatório) permite ao sync saber exatamente qual caminho sobrescrever, sem consultar nada antes. Nome de arquivo fixo por posição (`1.jpg`, `2.jpg`...) elimina a necessidade de comparar hash — o sync baixa de novo e sobrescreve, sempre.

## Consultas típicas do site público

- **Home / grid**: `select * from products where active = true [and tags && array[...]] order by created_at desc limit 16 offset :n`
- **Carrossel de mais vendidos**: `select * from products where active = true and best_seller = true`
- **Filtro por material/tag**: mesmo padrão da home, com `where material = :m` ou `where tags && array[:tag]`
- **Página de produto**: `select * from products where slug = :slug and active = true`
- **Opções de filtro (material/tag)**: `select distinct material from products where active = true` e `select distinct unnest(tags) from products where active = true`. Nunca uma lista fixa no código — as opções mudam conforme o que existe no Notion/Supabase.

Nenhuma dessas consultas toca a API do Notion — 100% contra o Postgres. Ver regra em [code-conventions](../.claude/skills/code-conventions/SKILL.md) (filtro e paginação sempre via query, nunca catálogo inteiro no client).

## Sincronização — resumo (detalhe completo em [notion-sync](../.claude/skills/notion-sync/SKILL.md))

- Sempre **full resync** — nunca incremental.
- Sempre **upsert** por `notion_page_id` — nunca insert duplicado.
- Produto ausente ou desativado no Notion → `active = false` no Supabase. **Nunca `DELETE`.**
- Disparado manualmente, só pelo botão "Sincronizar produtos" em `/admin`.

## Em aberto

- Tabela `sync_logs` para histórico de sincronizações — ainda não decidido se `synced_at` já é suficiente.
- Hard delete manual para produtos desativados há muito tempo — não implementado, não assumir que existe.
