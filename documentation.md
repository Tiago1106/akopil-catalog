# Akopil — Documentação

Documento único com tudo que existe sobre o projeto: arquitetura, stack, schema, design system, convenções e decisões. Substitui a pasta `docs/` (que tinha um arquivo por tema, com muita duplicação com as skills em `.claude/skills/`).

Regra geral: nenhuma decisão nova (visual, de schema, de convenção) deve ser inventada durante a implementação sem checar antes se já está coberta aqui. Se não estiver, perguntar ao usuário antes de assumir. Decisões novas viram uma entrada na seção [Log de decisões](#log-de-decisões), no final deste arquivo.

## Índice

- [Status do projeto](#status-do-projeto)
- [Visão geral](#visão-geral)
- [Stack](#stack)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Data model](#data-model)
- [Design system](#design-system)
- [Convenções de código](#convenções-de-código)
- [Escopo — o que este produto não é](#escopo--o-que-este-produto-não-é)
- [Decisões fechadas — não reabrir sem o usuário pedir](#decisões-fechadas--não-reabrir-sem-o-usuário-pedir)
- [Log de decisões](#log-de-decisões)

## Status do projeto

Checklist rápido de "o que já existe" vs. "o que falta". Atualizar aqui a cada mudança relevante — junto com uma entrada no [Log de decisões](#log-de-decisões) se for uma decisão nova, e uma entrada no [`CHANGELOG.md`](CHANGELOG.md) se for algo que já foi implementado.

### Feito

- [x] Sync Notion → Supabase (full resync, upsert, nunca hard delete) + upload de imagens pro Storage
- [x] Painel `/admin`: login (Supabase Auth), dashboard (última sincronização, produtos ativos), botão de sincronizar
- [x] Home pública: header fixo, carrossel "Mais vendidos", grid com infinite scroll (lotes de 16), footer
- [x] Página de produto: galeria (grid 2×2 desktop / carrossel mobile / lightbox), preço com suporte a promoção, material, tags, descrição
- [x] Carrinho: estado global (Zustand + `localStorage`), agrupado por produto com quantidade, drawer (`Sheet`)
- [x] Checkout: mensagem de WhatsApp montada a partir do carrinho, link `wa.me` real
- [x] UI em shadcn/ui, tokens monocromáticos, radius único `6px`
- [x] Versionamento do projeto (SemVer a partir de `1.0.0`, `CHANGELOG.md`)
- [x] Documentação consolidada num arquivo único (`documentation.md`)
- [x] Link "Sobre" removido do header (comentado em `components/site-header.tsx`) — sem página `/sobre` ainda, nav mostra só "Catálogo"

### Pendente
- [ ] Banner de imagens de promoções na home — precisa decisão de fonte de dado (Notion? upload manual?) e destino do link antes de implementar
- [ ] SEO por produto (`generateMetadata` com `og:image`) — link de produto é compartilhado no WhatsApp e hoje não gera preview
- [ ] `sitemap.ts` / `robots.ts` / `loading.tsx` / `error.tsx` — arquivos do Next.js que ajudam o Google a achar as páginas (`sitemap`/`robots`), mostram uma tela de carregamento enquanto a página busca dado (`loading`) e uma tela amigável quando dá erro (`error`). Nenhum existe ainda.
- [ ] Analytics (ex: Vercel Analytics) — mostraria quantas pessoas visitam o site e quais produtos são mais vistos. Não existe hoje.
- [ ] Hard delete manual de produto desativado há muito tempo — hoje um produto removido do Notion nunca é apagado de verdade, só fica invisível (`active = false`). Isso seria uma forma de apagar de vez os mais antigos, se um dia precisar.
- [ ] Log estruturado de syncs anteriores (`sync_logs`) — um histórico de cada sincronização (quando rodou, quantos produtos, erros). Hoje só sabemos a data do último sync.
- [ ] Sync incremental — hoje toda sincronização busca todos os produtos de novo, mesmo o que não mudou. Buscar só o que mudou só compensaria com um catálogo bem maior.

## Visão geral

Catálogo de óculos de sol com duas páginas públicas (home e produto), sem checkout de pagamento. A finalização de compra é um redirect para o WhatsApp com uma mensagem pré-formatada — não existe processamento de pagamento, gateway, ou conta de cliente.

Duas fontes de dado com papéis separados:

- **Notion** — interface de cadastro. É onde o produto é editado (nome, preço, material, tags, descrição, fotos, status ativo/inativo, best seller).
- **Supabase (Postgres + Storage)** — banco de verdade do site. É de onde a home, a paginação e a página de produto leem tudo.

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
                                                (home, paginação, produto)
```

**Por que essa divisão** (Notion não é lido em produção):

1. URLs de imagem do Notion expiram em ~1 hora — o sync baixa a imagem uma vez e re-hospeda no Supabase Storage, com URL permanente.
2. Paginação de verdade precisa de banco relacional — `ORDER BY ... LIMIT 16` é trivial em SQL; repetir contra a API do Notion a cada scroll seria lento e esbarraria em rate limit.
3. O site não pode depender da disponibilidade do Notion — se ele cair, o catálogo continua no ar porque lê de um banco próprio (Vercel + Supabase).

**Deploy e runtime:**

- Next.js (App Router), deploy na Vercel, domínio de produção `akopil.com.br`.
- Leitura pública (home, produto) roda em Server Components contra o Supabase — nunca expõe `SUPABASE_SECRET_KEY` ao client.
- Rota de sync e painel `/admin` são as únicas partes do sistema que falam com a API do Notion, só rodam autenticadas (Supabase Auth).
- Estado do carrinho é client-side (Zustand + `localStorage`), sem persistência em banco.

**Fluxo de sincronização** (botão "Sincronizar produtos" em `/admin`):

1. Rota autenticada busca todos os produtos do Notion via API, paginado (100 por página).
2. Para cada produto: extrai campos (nome, preço, material, tags, descrição, `Ativo`, `Best Seller`, URLs temporárias das fotos), baixa cada imagem e sobe pra `product-images/{notion_page_id}/{n}.jpg` no Storage (sobrescrevendo o que já existia), e faz **upsert** em `products` usando `notion_page_id` como chave de conflito.
3. Produto que sumiu do Notion ou veio com `Ativo` desmarcado → `active = false` (nunca `DELETE`).
4. Dispara `revalidatePath` nas rotas afetadas.

**Por que sempre full resync, nunca incremental**: pra 30-100 produtos, buscar a database inteira a cada sync é rápido e simples — não compensa a complexidade de detectar "o que mudou". Resync completo também corrige qualquer edição feita direto no Supabase por engano, porque o Notion sempre volta a ser fonte de verdade.

**Custo**: ambos ficam no free tier pro volume esperado (30-100 produtos). Único cuidado: projeto free do Supabase pausa após 7 dias sem nenhuma request.

## Stack

| Camada | Escolha | Notas |
|---|---|---|
| Framework | Next.js, App Router | Deploy na Vercel |
| Componentes de UI | shadcn/ui (base Radix, preset Nova) + lucide-react | Ver [Design system](#design-system) |
| Notificações | sonner (toast) | Única exceção com cor real (verde/vermelho) na paleta monocromática |
| Estado do carrinho | Zustand | Client-side, persistido em `localStorage` |
| Conteúdo/i18n | `locales/pt-BR.json` | Nenhuma string em português hardcoded em componente |
| Cadastro de produto | Notion | Interface de edição humana, nunca lido em produção pelo site |
| Banco de verdade | Supabase Postgres | Tabela `products` |
| Imagens | Supabase Storage | Bucket público `product-images` |
| Autenticação admin | Supabase Auth | Email/senha, conta única, sem multiusuário, sem OAuth |
| Checkout | Link `wa.me` | 100% client-side, sem gateway, sem processamento de cartão |

**Por que essa stack (resumo):**

- Supabase em vez de ler o Notion direto: ver seção [Visão geral](#visão-geral).
- Zustand em vez de Context/Redux: carrinho é estado simples, client-only, sem necessidade de middleware.
- `wa.me` em vez de gateway de pagamento: escopo do produto é catálogo + contato comercial, não e-commerce transacional.

## Variáveis de ambiente

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
NOTION_API_KEY=
NOTION_DATABASE_ID=
NEXT_PUBLIC_WHATSAPP_NUMBER=
```

Já configuradas no ambiente de deploy — usar exatamente esses nomes, não inventar variável nova sem necessidade clara.

- `SUPABASE_SECRET_KEY` **nunca** em código client-side — só em Route Handlers ou Server Components.
- `NOTION_API_KEY` só é usada dentro da rota de sync autenticada — nunca chamada a partir do client.
- `NEXT_PUBLIC_WHATSAPP_NUMBER` é pública por natureza (o link `wa.me` é montado no client) — formato internacional sem símbolos (ex: `5511999999999`).

## Data model

### Tabela `products`

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

| Campo | Notas |
|---|---|
| `notion_page_id` | Chave de ligação com o Notion. Chave de conflito no upsert do sync. |
| `slug` | Gerado a partir do nome no momento do sync. Busca de produto na URL pública é sempre por `slug`, nunca por `id`. |
| `images` | URLs já no Supabase Storage, em ordem — nunca URL do Notion (expira). Grid de produto é 2×2. |
| `original_price` | `null` quando não há desconto. Quando preenchido: preço riscado + badge outline "Promoção" (sem cor). |
| `active` | `false` para produto desativado/removido no Notion. **Nunca há `DELETE`.** Toda query pública filtra `active = true`. |
| `best_seller` | Decisão manual (checkbox no Notion). Nunca calculado por heurística de vendas. Alimenta o carrossel "Mais vendidos". |
| `synced_at` | Atualizado a cada upsert. Usado no `/admin` pra mostrar o último sync. |

### Supabase Storage — bucket `product-images`

```
product-images/
  {notion_page_id}/
    1.jpg
    2.jpg
    3.jpg
    4.jpg
```

`notion_page_id` como nome de pasta permite ao sync sobrescrever direto, sem consultar nada antes. Nome de arquivo fixo por posição elimina a necessidade de comparar hash — o sync baixa de novo e sobrescreve, sempre.

### Consultas típicas do site público

- **Home / grid**: `select * from products where active = true order by created_at desc limit 16 offset :n`
- **Carrossel de mais vendidos**: `select * from products where active = true and best_seller = true`
- **Página de produto**: `select * from products where slug = :slug and active = true`

Nenhuma dessas consultas toca a API do Notion — 100% contra o Postgres. Filtro e paginação são sempre via query (`WHERE`, `ORDER BY`, `LIMIT`/`OFFSET`) — nunca carregar o catálogo inteiro no client.

## Design system

**Princípio**: paleta 100% monocromática — preto, branco, cinza. Nenhum estado (hover, ativo, erro, promoção, disabled) introduz cor de destaque. Promoção é comunicada só por texto riscado + badge outline preto/branco. Restrição de marca, não placeholder.

**Exceções deliberadas** (não generalizar pra outros componentes):
- Toasts de sucesso/erro (sonner) usam verde/vermelho reais.
- Contador numérico do ícone de carrinho no header é um círculo (`rounded-full`) — um indicador pequeno não é uma "superfície" no sentido da regra de radius único.

**Componentes — sempre shadcn/ui**: todo componente novo de UI usa [shadcn/ui](https://ui.shadcn.com) (`npx shadcn@latest add <nome>`), base Radix, preset Nova. Nunca CSS/classes customizadas à mão quando existe componente shadcn equivalente. Se não existir no registry, perguntar ao usuário antes de construir algo customizado. Componentes instalados ficam em `components/ui/` (não editar a lógica interna, só os tokens em `app/globals.css`); composições próprias ficam em `components/`.

Inicialização usou a flag `--pointer`: todo `<button>`/`[role=button]` habilitado já recebe `cursor: pointer` globalmente — não adicionar `cursor-pointer` manualmente.

### Tokens

| Token shadcn | Valor | Equivale a | Uso |
|---|---|---|---|
| `--background` / `--card` / `--popover` | `#ffffff` | branco | Fundo geral, cards, popovers |
| `--foreground` / `--primary` | `#111111` | preto | Texto, botões sólidos, bordas de destaque |
| `--primary-foreground` | `#ffffff` | branco | Texto sobre botão sólido |
| `--secondary` / `--muted` / `--accent` | `#f5f5f5` | gray-1 | Fundos secundários, hover, placeholders |
| `--muted-foreground` | `#525252` | gray-4 | Texto secundário (labels, preço em cinza) |
| `--border` / `--input` | `#e5e5e5` | gray-2 | Bordas neutras, divisores |
| `--ring` | `#111111` | preto | Anel de foco — nunca azul/colorido |
| `--sidebar` | `#f5f5f5` | gray-1 | Fundo da sidebar do admin |
| `--gray-3` | `#a3a3a3` | — | Texto terciário / preço riscado |
| `--radius` | `0.375rem` (`6px`) | — | Radius único |

### Radius

`6px` único em toda superfície com borda — fotos, botões, pills, badges, drawer. Nunca `border-radius: 50%`/pill totalmente redondo, nunca `0` totalmente quadrado (decisão já revertida uma vez, não reabrir). A escala de radius do Tailwind inteira foi achatada em `app/globals.css` pra sempre resolver em `var(--radius)`.

### Tipografia

Uma família só: Inter. Hierarquia por peso — `900` logo, `700` títulos/CTA, `500`/`400` corpo/labels/texto secundário.

### Estrutura — Home

Header → carrossel "Mais vendidos" (scroll horizontal, `best_seller = true`) → Grid de produtos (imagem, nome, tags, preço; 4 colunas desktop / 2 mobile, infinite scroll em lotes de ~16) → Footer.

Filtros (pills "Todos" + material/tag) faziam parte do design original mas **não foram implementados** — removidos do escopo por decisão do usuário. Se retomados: lista de opções sempre via `select distinct` contra `products`, nunca uma lista fixa no código.

### Estrutura — Produto

Duas colunas (empilha no mobile): grid 2×2 de fotos à esquerda (carrossel de 1 foto no mobile, lightbox em tela cheia no desktop); à direita eyebrow, nome, preço (+ riscado e badge "Promoção" quando há `original_price`), campo Material, campo Tags (pills), descrição curta, e um botão único "Adicionar ao carrinho" (adiciona + abre o drawer).

### Estrutura — Drawer do carrinho

Painel deslizante da direita (`Sheet` do shadcn), não é rota própria. Cabeçalho "Sacola" com fechar, lista de itens (miniatura, nome, preço, stepper de quantidade, remover), subtotal, dois botões (`Continuar comprando` outline / `Finalizar compra` sólido — vira link real pro `wa.me` quando o carrinho não está vazio e a env var do WhatsApp está configurada; `disabled` nos outros casos).

### Mensagem do WhatsApp (finalizar compra)

Decisão fechada: sempre envia todos os itens do carrinho numa mensagem só. Sintaxe do próprio WhatsApp (`*texto*` negrito, `~texto~` riscado):

```
Olá! Vim pelo site e gostaria de finalizar a compra.

────────────────────

*Item 1:*
Óculos Aviador
R$ 120,00

────────────────────

*Item 2:*
2x Óculos Redondo
~R$ 300,00~ → R$ 240,00

────────────────────

Valor total: R$ 420,00
Valor com desconto: R$ 360,00
```

Regras:
- Item com `quantity > 1` prefixa o nome com `NxN`; preço já multiplicado pela quantidade.
- **Valor total** = soma de `original_price ?? price` de cada item. **Valor com desconto** = soma de `price`.
- Se **nenhum** item tem desconto, mostra só uma linha `Valor: R$ X,XX`.
- Preço formatado via `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`.
- Link final: `https://wa.me/{numero}?text={mensagem}` — mensagem inteira (com quebras de linha) via `encodeURIComponent`. `{numero}` vem de `NEXT_PUBLIC_WHATSAPP_NUMBER`, nunca hardcoded.
- Todo texto fixo entra em `pt-BR.json` — não inventar variação (emojis, texto extra, reordenar seções) sem o usuário pedir.

## Convenções de código

- **Idioma**: todo código (variáveis, funções, componentes, arquivos) em inglês, mesmo pra conceitos de domínio em português (`bestSeller`, não `maisVendido`). Só `pt-BR.json` é em português.
- **i18n**: nenhuma string em português hardcoded em componente, mesmo textos triviais ("Remover", "Sacola") — tudo via `pt-BR.json` referenciado por chave.
- **Comentários**: sem comentário no código a menos que explicitamente pedido.
- **Filtro e paginação**: sempre via query no Postgres — nunca carregar o catálogo inteiro no client.
- **Componentes de UI**: sempre shadcn/ui — ver [Design system](#design-system).

**Estrutura de projeto:**

- `app/` — rotas (home, `[slug]` de produto, `/admin`, route handlers de sync/auth).
- `components/ui/` — componentes gerados pela CLI do shadcn, não editar a lógica interna.
- `components/` (raiz) — composições próprias com peças do shadcn.
- `lib/supabase/` — clients server-safe (`server.ts`) e admin/service-role (`admin.ts`) separados explicitamente.
- `lib/notion/`, `lib/sync/` — integração com Notion (só a rota de sync) e orquestração do sync.
- `store/` — Zustand store do carrinho.
- `locales/pt-BR.json` — todo texto visível ao usuário.

## Escopo — o que este produto não é

- Não é e-commerce com checkout de pagamento.
- Não tem conta de cliente (só login único de admin).
- Não lê o Notion em nenhuma rota pública.
- Não faz sync automático/agendado — só sob clique manual em `/admin`.

## Decisões fechadas — não reabrir sem o usuário pedir

- Radius único `6px` em tudo.
- Paleta 100% monocromática, nenhuma cor de destaque em nenhum estado.
- Sync é sempre full resync, nunca incremental, nunca hard delete.
- `best_seller` é sempre decisão manual no Notion.
- Mensagem do WhatsApp sempre agrega todos os itens do carrinho, nunca por item individual.
- Filtros de material/tag removidos do escopo (Fase 2) — não reimplementar sem pedido explícito.
- Um botão só na página de produto ("Adicionar ao carrinho", que já abre o drawer) — "Abrir agora" foi removido por ser redundante.
- CTA de "adicionar ao carrinho" direto no card do grid foi considerado e rejeitado (hover não existe em touch, mobile é prioridade) — só as tags do produto foram mantidas no card.
- Versionamento do projeto segue [SemVer](https://semver.org/lang/pt-BR/), a partir de `1.0.0` (ver [`CHANGELOG.md`](CHANGELOG.md)).

## Log de decisões

Entradas novas de decisão de produto/arquitetura entram aqui, mais recente primeiro. Detalhe de implementação (o que mudou em código) vai no [`CHANGELOG.md`](CHANGELOG.md).

### 2026-09-04

- Consolidação de documentação: pasta `docs/` (10 arquivos, com bastante duplicação com `.claude/skills/`) apagada, substituída por este arquivo único (`documentation.md`) na raiz. `README.md` reescrito com conteúdo real do projeto; versionamento (SemVer) adotado a partir de `1.0.0`; `CHANGELOG.md` criado.
