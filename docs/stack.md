# Akopil — Stack

Decisões de tecnologia já fechadas para este projeto. Não trocar sem perguntar.

## Frontend / aplicação

| Camada | Escolha | Notas |
|---|---|---|
| Framework | Next.js, App Router | Deploy na Vercel |
| Componentes de UI | shadcn/ui (base Radix, preset Nova) + lucide-react (ícones) | Sempre shadcn — ver [design-system.md](design-system.md). Tokens remapeados pra paleta monocromática, radius achatado em `6px` único |
| Notificações | sonner (toast) | Feedback de ações assíncronas (ex: sincronizar produtos); única exceção com cor real (verde/vermelho) na paleta monocromática |
| Estado do carrinho | Zustand | Client-side, sem persistência em banco |
| Conteúdo/i18n | `pt-BR.json` | Nenhuma string em português hardcoded em componente — ver [i18n-content](../.claude/skills/i18n-content/SKILL.md) |

## Dados

| Camada | Escolha | Papel |
|---|---|---|
| Cadastro de produto | Notion | Interface de edição humana. **Nunca lido em produção** pelo site — só pela rota de sync |
| Banco de verdade | Supabase Postgres | Tabela `products`, lida por toda a UI pública |
| Imagens | Supabase Storage | Bucket público `product-images`, re-hospeda o que veio do Notion |
| Autenticação admin | Supabase Auth | Email/senha, conta única, sem multiusuário, sem OAuth |

Detalhe completo do schema e do fluxo de sync em [data-model.md](data-model.md).

## Checkout

Não há checkout de pagamento. Finalização de compra é 100% client-side: monta um link `wa.me` com mensagem formatada e redireciona. Sem gateway, sem processamento de cartão, sem carrinho persistido em banco.

## Variáveis de ambiente

Já configuradas no ambiente de deploy — usar exatamente estes nomes, não inventar novos:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
NOTION_API_KEY=
NOTION_DATABASE_ID=
NEXT_PUBLIC_WHATSAPP_NUMBER=
```

Regra de segurança inegociável: `SUPABASE_SECRET_KEY` nunca é usada em código client-side — só em Route Handlers ou Server Components. `NOTION_API_KEY` só é usada dentro da rota de sync autenticada (nunca chamada a partir do client, e nunca fora do fluxo de `/admin`). `NEXT_PUBLIC_WHATSAPP_NUMBER` é a única nova variável do checkout — pública por natureza (usada para montar o link `wa.me` no client), formato internacional sem símbolos (ex: `5511999999999`).

## Por que essa stack (resumo das decisões)

- **Supabase em vez de ler o Notion direto**: URLs de imagem do Notion expiram (~1h), filtro/paginação real precisa de SQL, e o site não pode depender da disponibilidade do Notion. Detalhes em [architecture.md](architecture.md).
- **Zustand em vez de Context/Redux**: carrinho é estado simples, client-only, sem necessidade de middleware ou dev tools de um Redux completo.
- **wa.me em vez de gateway de pagamento**: escopo do produto é catálogo + contato comercial via WhatsApp, não e-commerce transacional.
