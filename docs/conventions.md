# Akopil — Convenções

Versão carregada automaticamente pelo Claude Code ao gerar arquivos: [code-conventions (skill)](../.claude/skills/code-conventions/SKILL.md). Este documento é a mesma referência para leitura humana.

## Idioma no código

Todo código — variáveis, funções, componentes, nomes de arquivo — em inglês, mesmo para conceitos de domínio em português (`bestSeller`, não `maisVendido`). Só o conteúdo de `pt-BR.json` é em português.

## Conteúdo e i18n

Nenhuma string em português hardcoded em componente. Todo texto visível ao usuário passa por `pt-BR.json` e é referenciado por chave — inclusive textos triviais ("Remover", "Sacola"). Detalhe do formato da mensagem do WhatsApp em [i18n-content](../.claude/skills/i18n-content/SKILL.md).

## Comentários

Sem comentário no código a menos que explicitamente pedido.

## Segurança — variáveis de ambiente

`SUPABASE_SECRET_KEY` nunca em código client-side — só em Route Handlers / Server Components. `NOTION_API_KEY` só dentro da rota de sync autenticada.

## Filtro e paginação

Sempre via query no Postgres — nunca carregar o catálogo inteiro no client para filtrar em memória.

## Componentes de UI — sempre shadcn/ui

Todo componente novo (botão, card, input, badge, sidebar, etc.) usa [shadcn/ui](https://ui.shadcn.com) (`npx shadcn@latest add <nome>`) — nunca CSS/classes customizadas à mão quando existe um componente equivalente no registry. Se o componente necessário não existir, perguntar ao usuário antes de construir algo customizado.

## Estrutura de projeto (Next.js App Router)

Convenção em uso, confirmada na Fase 1:

- `app/` — rotas (home, `[slug]` de produto, `/admin`, route handlers de sync/auth).
- `components/ui/` — componentes gerados pela CLI do shadcn, não editar a lógica interna.
- `components/` (raiz) — composições próprias feitas com peças do shadcn (ex: `app-sidebar.tsx`).
- `lib/supabase/` — clients do Supabase, server-safe (`server.ts`) e admin/service-role (`admin.ts`) separados explicitamente; `lib/utils.ts` — helper `cn()` do shadcn.
- `lib/notion/`, `lib/sync/` — integração com Notion (só usada pela rota de sync) e orquestração do sync.
- `store/` — Zustand store do carrinho (ainda não criado — Fase 2/3).
- `locales/pt-BR.json` — todo texto visível ao usuário.

Mantida a separação client/server explícita para as chaves do Supabase.

## Escopo — o que este produto não é

- Não é e-commerce com checkout de pagamento.
- Não tem conta de cliente (só login único de admin).
- Não lê o Notion em nenhuma rota pública.
- Não faz sync automático/agendado — só sob clique manual em `/admin`.

## Decisões fechadas — não reabrir sem o usuário pedir

- Radius único `6px` em tudo.
- Paleta 100% monocromática.
- Sync é sempre full resync, nunca incremental, nunca hard delete.
- `best_seller` é sempre decisão manual no Notion.
- Mensagem do WhatsApp sempre agrega todos os itens do carrinho, nunca por item individual.
