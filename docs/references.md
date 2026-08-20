# Akopil — Referências externas

## Documentos-fonte (não editar sem necessidade — são a origem das decisões)

- [akopil-database.md](akopil-database.md) — por que Supabase, schema completo de `products`, estrutura do Storage, fluxo de sync/resync, script SQL de setup.
- [akopil-layout.md](akopil-layout.md) — design tokens, estrutura das páginas, drawer do carrinho, formato da mensagem do WhatsApp.
- [akopil-layout-mockup.html](akopil-layout-mockup.html) — mockup navegável (home / produto / carrinho), abrir direto no navegador para referência visual.

## Serviços externos

| Serviço | Papel | Onde é usado |
|---|---|---|
| Supabase | Postgres (tabela `products`) + Storage (bucket `product-images`) + Auth (login do `/admin`) | Toda leitura pública, rota de sync (escrita), `/admin` |
| Notion | Interface de cadastro de produto (database já criada, conectada à integração) | Só lido pela rota de sync, nunca em produção pública |
| Vercel | Deploy do Next.js | — |
| WhatsApp (`wa.me`) | Canal de finalização de compra | Client-side, sem API oficial do WhatsApp — só link `wa.me` com mensagem via query string |

## Domínio de produção

`akopil.com.br` — configurar como domínio custom do projeto na Vercel.

## Variáveis de ambiente

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
NOTION_API_KEY=
NOTION_DATABASE_ID=
NEXT_PUBLIC_WHATSAPP_NUMBER=
```

`NEXT_PUBLIC_WHATSAPP_NUMBER` guarda o número de destino do link `wa.me`, em formato internacional sem símbolos (ex: `5511999999999`). É `NEXT_PUBLIC_` porque o link é montado no client, junto com a mensagem — não é dado sensível. Precisa ser configurada no ambiente de deploy antes do checkout funcionar; valor ainda não fornecido.

Detalhe de uso e restrição de escopo (client vs. server) em [stack.md](stack.md).

## Filtros de material/tag

Não existe lista fixa de materiais/tags no código. Os filtros da home são sempre derivados dos valores distintos presentes em `products` no Supabase (que por sua vez vêm do Notion via sync) — ver consulta em [data-model.md](data-model.md). Os valores do mockup (Acetato, Metal, Polarizado, Em promoção) são só exemplo visual, não um enum a implementar.
