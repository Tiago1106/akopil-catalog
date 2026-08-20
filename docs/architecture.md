# Akopil — Arquitetura

## Visão geral

Catálogo de óculos de sol com duas páginas públicas (home e produto), sem checkout de pagamento. A finalização de compra é um redirect para o WhatsApp com uma mensagem pré-formatada — não existe processamento de pagamento, gateway, ou conta de cliente.

Duas fontes de dado com papéis separados:

- **Notion** — interface de cadastro. É onde o produto é editado (nome, preço, material, tags, descrição, fotos, status ativo/inativo, best seller).
- **Supabase (Postgres + Storage)** — banco de verdade do site. É de onde a home, o filtro, a paginação e a página de produto leem tudo.

O site em produção **nunca chama a API do Notion**. O Notion só entra em jogo quando alguém aperta "Sincronizar produtos" no painel `/admin`.

```
[Edição no Notion] → [Botão "Sincronizar" em /admin] → [Rota de sync]
                                                              │
                                          ┌───────────────────┴───────────────────┐
                                          ▼                                       ▼
                               Supabase Storage (imagens)           Supabase Postgres (dados)
                                          │                                       │
                                          └───────────────┬───────────────────────┘
                                                           ▼
                                                Site lê direto do Supabase
                                                (home, filtro, paginação, produto)
```

## Por que essa divisão (Notion não é lido em produção)

1. **URLs de imagem do Notion expiram em ~1 hora.** Se o site linkasse direto para elas, fotos quebrariam ao longo do dia. O sync baixa a imagem uma vez e re-hospeda no Supabase Storage, com URL permanente.
2. **Filtro e paginação de verdade precisam de banco relacional.** `WHERE material = 'acetato' ORDER BY price LIMIT 16` é trivial em SQL contra o Postgres; repetir isso contra a API do Notion a cada scroll seria lento, instável e esbarraria em rate limit.
3. **O site não pode depender da disponibilidade do Notion.** Se o Notion cair ou a API demorar, o catálogo continua no ar normalmente, porque lê de um banco próprio dentro da mesma infraestrutura (Vercel + Supabase).

Detalhamento completo do fluxo de sync — passo a passo, regras de upsert, política de "nunca deletar" — está em [notion-sync](../.claude/skills/notion-sync/SKILL.md) e na fonte original [akopil-database.md](akopil-database.md) (seções 6 a 10).

## Deploy e runtime

- **Next.js (App Router)**, deploy na **Vercel**, domínio de produção `akopil.com.br`.
- Leitura pública (home, produto) roda em Server Components / rotas server-side contra o Supabase — nunca expõe `SUPABASE_SECRET_KEY` ao client.
- Rota de sync e painel `/admin` são as únicas partes do sistema que falam com a API do Notion, e só rodam autenticadas (Supabase Auth).
- Estado do carrinho é client-side (Zustand), sem persistência em banco — a "sacola" existe só na sessão do navegador.

## Fluxo de dados em runtime (site público)

1. Usuário abre a home → Server Component consulta `products` no Postgres (filtro `active = true`, opcionalmente `best_seller = true` para o carrossel), pagina em lotes de ~16.
2. Usuário aplica filtro (material/tag) → nova query no Postgres com `WHERE`, nunca filtro em memória no client.
3. Usuário abre um produto → busca por `slug` direto no Postgres.
4. Usuário adiciona itens ao carrinho (Zustand, em memória/localStorage no client) e finaliza → monta mensagem formatada (ver [i18n-content](../.claude/skills/i18n-content/SKILL.md)) e abre `https://wa.me/{numero}?text={mensagem}`.

Em nenhum desses passos há chamada ao Notion.

## Fluxo de sincronização (admin)

1. Usuário loga em `/admin` via Supabase Auth.
2. Aperta "Sincronizar produtos" → rota autenticada busca todos os produtos do Notion (paginado, 100 por página), baixa imagens para o Storage, faz upsert em `products` por `notion_page_id`, marca como `active = false` o que sumiu ou foi desmarcado no Notion.
3. Rota dispara `revalidatePath` nas páginas afetadas para o Next.js atualizar o cache.

Regras completas (por que é sempre full resync, por que nunca há hard delete) em [notion-sync](../.claude/skills/notion-sync/SKILL.md).

## Custo e limites operacionais

Ambos ficam no free tier para o volume esperado (30–100 produtos): Supabase free (500MB banco + 1GB Storage) folgado para esse tamanho de catálogo. Único cuidado: projeto free do Supabase pausa após 7 dias sem nenhuma request — risco baixo com tráfego normal, relevante só em períodos sem visitas (ex: pré-lançamento).

## Em aberto (não decidido, não assumir)

- Hard delete manual de produto desativado há muito tempo.
- Log estruturado de syncs anteriores (`sync_logs`) além do campo `synced_at`.
- Sync incremental, caso o catálogo cresça muito além de 100 produtos — não necessário hoje.
