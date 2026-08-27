---
name: code-conventions
description: Convenções de código do Akopil — idioma, comentários, variáveis de ambiente, onde o filtro/paginação roda. Ler antes de escrever ou revisar qualquer arquivo do projeto.
---

# Convenções de código — Akopil

## Idioma

Todo código — variáveis, funções, componentes, nomes de arquivo — em inglês. Nenhuma exceção, mesmo para conceitos de domínio em português (ex: `bestSeller`, não `maisVendido`). Texto visível ao usuário segue a regra separada em [[i18n-content]] (`pt-BR.json`, nunca hardcoded no componente).

## Comentários

Sem comentário no código a menos que o usuário peça explicitamente. Nomes bem escolhidos substituem comentário explicativo.

## Stack e onde cada coisa roda

- Next.js App Router, deploy na Vercel.
- Banco: Supabase (Postgres + Storage). Notion é só interface de cadastro — nunca lido em produção (ver [[notion-sync]]).
- UI: sempre shadcn/ui (ver [[design-system]]) — nunca CSS/classes customizadas quando existe componente equivalente no registry.
- Estado do carrinho: Zustand (ainda não criado — Fase 2/3).
- Checkout: 100% client-side, monta link `wa.me` — sem processamento de pagamento, sem gateway.

## Variáveis de ambiente

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
NOTION_API_KEY=
NOTION_DATABASE_ID=
NEXT_PUBLIC_WHATSAPP_NUMBER=
```

Já configuradas — só usar os nomes acima, não criar variável nova sem necessidade clara. `NEXT_PUBLIC_WHATSAPP_NUMBER` é a exceção mais recente: número de destino do link `wa.me`, formato internacional sem símbolos (ex: `5511999999999`). É `NEXT_PUBLIC_` porque o link é montado no client — não é dado sensível.

`SUPABASE_SECRET_KEY` **nunca** em código client-side (nada que rode no bundle do browser). Só em Route Handlers ou Server Components. O mesmo vale, por natureza, para `NOTION_API_KEY` — o Notion só é chamado a partir da rota de sync autenticada, nunca do client.

## Filtro e paginação

Sempre via query no Postgres (`WHERE`, `ORDER BY`, `LIMIT`/`OFFSET` ou keyset) — nunca carregar o catálogo inteiro no client e filtrar em memória. Grid da home pagina em lotes de ~16 via infinite scroll; carrossel de mais vendidos filtra `best_seller = true` no servidor. Os próprios valores de material/tag usados nos filtros também vêm de query (`select distinct`) contra `products` — nunca uma lista fixa no código, porque a lista real vem do Notion via sync.

## Escopo do produto

Duas páginas (home + produto) sem carrinho de pagamento. Finalização é sempre um redirect para o WhatsApp com mensagem pronta (ver [[i18n-content]]) — não implementar checkout, gateway de pagamento, ou conta de cliente além do login único do `/admin`.

## Decisões fechadas — não reabrir sem o usuário pedir

- Radius único `6px` em tudo (ver [[design-system]]).
- Paleta 100% monocromática, nenhuma cor de destaque em nenhum estado.
- Sync é sempre full resync, nunca incremental, nunca hard delete (ver [[notion-sync]]).
- `best_seller` é sempre decisão manual no Notion.
