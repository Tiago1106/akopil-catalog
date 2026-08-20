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

## Estrutura de projeto (Next.js App Router)

Convenção a seguir ao criar rotas e componentes:

- `app/` — rotas (home, `[slug]` de produto, `/admin`, route handlers de sync/auth).
- `components/` — componentes de UI compartilhados (Header, Footer, ProductCard, CartDrawer, Pill, Button).
- `lib/` ou `server/` — client do Supabase (server-only vs. browser-safe separados explicitamente), integração com Notion (só usada pela rota de sync).
- `store/` — Zustand store do carrinho.
- `locales/` ou raiz do projeto — `pt-BR.json`.

Esta é uma convenção sugerida para manter o projeto organizado, não uma imposição rígida do briefing original — ajustar se o Claude Code identificar um padrão mais natural ao gerar a primeira rota, mas manter a separação client/server explícita para as chaves do Supabase.

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
