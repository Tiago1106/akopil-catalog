# Akopil — Catálogo

Catálogo de óculos de sol da Akopil: home com carrossel de mais vendidos e grid paginado, página de produto, carrinho (sacola) persistido no navegador, e finalização via redirect para o WhatsApp com mensagem pronta — sem checkout de pagamento.

Cadastro de produto (e de banner promocional) é nativo, feito direto em `/admin` — sem CMS externo.

## Stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript
- [Supabase](https://supabase.com) (Postgres + Storage + Auth) — banco de produção
- [Tailwind CSS](https://tailwindcss.com) v4 + [shadcn/ui](https://ui.shadcn.com) (base Radix, preset Nova)
- [Zustand](https://zustand.docs.pmnd.rs) — estado do carrinho, persistido em `localStorage`

Detalhes de arquitetura, schema e decisões de design em [`documentation.md`](documentation.md).

## Rodando localmente

```bash
npm install
npm run dev
```

Abre em [http://localhost:3000](http://localhost:3000).

Variáveis de ambiente necessárias (ver [code-conventions](.claude/skills/code-conventions/SKILL.md) pra detalhes de cada uma):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
NEXT_PUBLIC_WHATSAPP_NUMBER=
```

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run start` | Serve o build de produção |
| `npm run lint` | ESLint |

## Documentação

- [`documentation.md`](documentation.md) — arquitetura, stack, data model, design system, convenções e log de decisões. Ler antes de começar qualquer sessão de trabalho nova.
- [`CHANGELOG.md`](CHANGELOG.md) — histórico de versões.

## Deploy

Vercel, branch `main`, domínio de produção `akopil.com.br`.
