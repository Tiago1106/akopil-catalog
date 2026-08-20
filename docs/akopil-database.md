# Akopil — Arquitetura de Banco de Dados

## 1. Visão geral

O catálogo tem duas fontes de dado com papéis bem separados:

- **Notion** → interface de cadastro. É onde você edita produto: nome, preço, material, tags, descrição, fotos, status ativo/inativo.
- **Supabase (Postgres + Storage)** → banco de verdade do site. É de onde a página lê tudo — listagem, filtro, paginação, página de produto.

O site em produção **nunca fala com a API do Notion**. Ele só lê do Supabase. O Notion entra em cena apenas no momento em que você aperta o botão "Sincronizar produtos" no painel admin.

```
[Você edita no Notion] → [Botão "Sincronizar" no /admin] → [Rota de sync]
                                                                  │
                                              ┌───────────────────┴───────────────────┐
                                              ▼                                       ▼
                                   Supabase Storage (imagens)           Supabase Postgres (dados)
                                              │                                       │
                                              └───────────────┬───────────────────────┘
                                                               ▼
                                                    Site lê direto do Supabase
                                                    (listagem, filtro, produto)
```

## 2. Por que salvar no Supabase (e não ler o Notion direto)

Três motivos concretos:

1. **URLs de imagem do Notion expiram em ~1 hora.** Se o site linkasse direto pra elas, as fotos quebrariam sozinhas ao longo do dia. Precisamos baixar a imagem uma vez e re-hospedar em algum lugar com URL permanente — esse lugar é o Supabase Storage.
2. **Filtro e paginação de verdade precisam de um banco relacional.** Fazer `WHERE material = 'acetato' ORDER BY price LIMIT 16` é trivial em SQL. Fazer isso contra a API do Notion a cada scroll do usuário seria lento, instável e ainda esbarraria no limite de rate da API.
3. **O site não pode depender da disponibilidade do Notion.** Se o Notion cair ou a API demorar, o catálogo continua no ar normalmente, porque ele lê de um banco que já é seu, dentro da sua própria infraestrutura (Vercel + Supabase).

Resumindo: Notion é bom pra **editar**, ruim pra **servir**. Supabase é o contrário — não é feito pra ser editor de conteúdo amigável, mas é exatamente o que uma página pública precisa pra ler rápido e de forma confiável.

## 3. Custo

Ambos ficam no free tier pro seu volume (30–100 produtos):

- **Supabase free**: 500MB de banco + 1GB de Storage — muito acima do que um catálogo desse tamanho usa.
- **Único cuidado**: projeto free do Supabase pausa depois de 7 dias sem nenhuma request. Um site recebendo visitas normalmente nunca chega perto disso; só é risco se o site ficar muito tempo sem tráfego nenhum (ex: antes do lançamento).

## 4. Schema do Postgres

Tabela principal:

```sql
create table products (
  id                uuid primary key default gen_random_uuid(),
  notion_page_id    text unique not null,       -- vínculo com a origem no Notion
  slug              text unique not null,        -- usado na URL da página de produto
  name              text not null,
  price             numeric not null,
  original_price    numeric,                     -- preenchido só quando está em promoção
  material          text,
  description       text,
  tags              text[] default '{}',
  images            text[] default '{}',         -- URLs no Supabase Storage, em ordem (2x2)
  active            boolean not null default true,
  best_seller       boolean not null default false, -- marcado manualmente no Notion, alimenta o carrossel da home
  synced_at         timestamptz not null default now(),
  created_at        timestamptz not null default now()
);

create index products_active_idx on products (active);
create index products_tags_idx on products using gin (tags);
create index products_best_seller_idx on products (best_seller) where best_seller = true;
```

Notas de design:

- `notion_page_id` é a chave de ligação entre os dois sistemas — é ela que permite fazer *upsert* em vez de duplicar produto a cada sync.
- `slug` é gerado a partir do nome no momento do sync (ex: "Óculos Aviador Preto" → `oculos-aviador-preto`), usado na URL da página de produto.
- `images` guarda um array de URLs já apontando pro Supabase Storage — nunca URL do Notion.
- `original_price` fica `null` quando não há desconto; quando preenchido, o front usa pra mostrar o preço riscado + badge outline (sem cor, conforme o padrão monocromático já definido).
- `best_seller` é decisão manual: marcado direto na tabela do Notion (checkbox), entra no sync igual o `Ativo`. É o que alimenta o carrossel de "Mais vendidos" da home — sem lógica automática de vendas.
- Não existe hard delete automático nessa tabela — ver seção 6.

## 5. Supabase Storage — imagens

Bucket público (`product-images`), organizado por produto:

```
product-images/
  {notion_page_id}/
    1.jpg
    2.jpg
    3.jpg
    4.jpg
```

Usar `notion_page_id` como pasta (em vez de um id aleatório) tem uma vantagem direta: no resync, a rota sabe exatamente qual caminho sobrescrever, sem precisar consultar nada antes. Nome de arquivo fixo por posição (`1.jpg`, `2.jpg`...) também elimina a necessidade de comparar hash pra saber se a imagem mudou — o sync simplesmente baixa de novo e sobrescreve.

## 6. Fluxo de sincronização (o que acontece ao clicar em "Sincronizar")

1. Rota autenticada (`/admin`, só acessível logado) dispara a sincronização.
2. Busca **todos** os produtos da database do Notion via API, paginado (a API do Notion devolve no máximo 100 por página).
3. Para cada produto retornado:
   - Extrai os campos (nome, preço, material, tags, descrição, status `Ativo`, `Best Seller`, URLs temporárias das fotos).
   - Baixa cada imagem da URL temporária do Notion e sobe pro Storage em `product-images/{notion_page_id}/{n}.jpg`, sobrescrevendo o que já existia.
   - Faz **upsert** na tabela `products` usando `notion_page_id` como chave de conflito — se o produto já existe, atualiza; se não existe, insere.
4. Ao final, qualquer produto que **não apareceu** nesta busca (foi removido do Notion) ou que veio com `Ativo` desmarcado é marcado como `active = false` no Supabase.
5. Dispara `revalidatePath` nas rotas afetadas (home e páginas de produto), pra o Next.js atualizar o cache imediatamente.

## 7. Por que é sempre um resync completo (nunca incremental)

Para 30–100 produtos, buscar a database inteira do Notion a cada sync é rápido e simples — não compensa a complexidade de tentar detectar "o que mudou desde a última vez" (isso exigiria guardar timestamps, comparar campo a campo, lidar com casos de borda). Resync completo também é mais seguro: qualquer edição feita direto no Supabase por engano é corrigida automaticamente na próxima sincronização, porque o Notion sempre volta a ser a fonte de verdade dos dados de conteúdo.

## 8. Produto removido ou desativado — nunca é deletado

Regra fixa: o sync **nunca** faz `DELETE` na tabela `products`. Ele só atualiza `active`:

- Produto com `Ativo` desmarcado no Notion → `active = false`.
- Produto que sumiu inteiramente da database do Notion (foi apagado por lá) → também cai pra `active = false` na próxima sincronização.

Isso evita perda acidental de dado e mantém histórico. O site só lista/mostra produtos com `active = true`; o resto fica no banco mas invisível pro público. Dá pra revisitar essa regra depois se você quiser um hard delete manual eventual.

## 9. Como o site lê os dados (sem tocar no Notion)

- **Listagem/home**: query no Postgres com filtro (`tags`, `material`) e paginação via `LIMIT`/`OFFSET` ou keyset, carregada em lotes de ~16 pro infinite scroll.
- **Página de produto**: busca por `slug`, direto no Postgres.
- Em nenhum desses casos há chamada à API do Notion — a leitura é 100% contra o Supabase, o que garante resposta rápida e catálogo no ar mesmo se o Notion estiver fora do ar.

## 10. Painel admin

- Rota `/admin`, protegida por Supabase Auth (email/senha, conta única — sem multiusuário, sem OAuth).
- Único botão relevante: "Sincronizar produtos", que dispara o fluxo da seção 6.
- Idealmente mostra o resultado do último sync (quantos produtos atualizados, horário) usando o campo `synced_at`.

## 11. Em aberto pra decidir depois

- Se algum dia quiser hard delete manual de um produto desativado há muito tempo.
- Se vale mostrar um log simples de syncs anteriores no `/admin` (tabela `sync_logs`) ou se o campo `synced_at` já é suficiente.
- Se o volume crescer muito além de 100 produtos, vale reavaliar sync incremental — mas não é necessário agora.

## 12. Setup inicial (rodar uma vez no SQL Editor do Supabase)

Script único que cria a tabela `products` com todas as colunas, os índices, e o bucket de imagens já como público:

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

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true);
```

Depois de rodar, confirmar:

- **Table Editor** → tabela `products` aparece com todas as colunas.
- **Storage** → bucket `product-images` existe e está marcado como público.
