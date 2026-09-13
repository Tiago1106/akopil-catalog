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
- [x] Banner de imagens de promoções: tabela `banners` + bucket `banner-images`, admin `/admin/banners` (upload multi-arquivo em modal, nome editável, drag-and-drop desktop-only, ativo/inativo, link opcional, confirmação antes de excluir), carrossel autoplay na Home entre "Mais vendidos" e o grid
- [x] Notion aposentado — cadastro de produto nativo em `/admin/products` (criar/editar página cheia, até 4 fotos na ordem de upload, tags/material texto livre), quantidade em estoque (badge "Esgotado" sobre a foto, "Última unidade!" inline, teto no carrinho, revalidação de estoque no checkout), e importação em lote via CSV+ZIP exportado do Notion (parse 100% no navegador, pula duplicata por nome) — em produção
- [x] Ambiente de dev separado: segundo projeto Supabase (schema espelhado, sem dado de prod) + `.env.development.local`, usado pra validar todo o trabalho acima antes de ir pra produção
- [x] `price`/`discount_price`: `price` é o valor real/cheio, `discount_price` o valor cobrado quando há promoção (era `original_price`, papel invertido) — migrado em produção em duas etapas (expand: adicionar coluna nova; contract: trocar valores e apagar a coluna antiga), sem janela de downtime

### Pendente
- [ ] Vulnerabilidade crítica de RCE no Next.js (`next@16.3.1`, ver aviso do `npm audit`) — upgrade pra `16.3.5+` não feito ainda, precisa de confirmação antes (pode ter breaking change)
- [ ] Remover `NOTION_API_KEY`/`NOTION_DATABASE_ID` do ambiente de deploy (não usados mais)
- [ ] SEO por produto (`generateMetadata` com `og:image`) — link de produto é compartilhado no WhatsApp e hoje não gera preview
- [ ] `sitemap.ts` / `robots.ts` / `loading.tsx` / `error.tsx` — arquivos do Next.js que ajudam o Google a achar as páginas (`sitemap`/`robots`), mostram uma tela de carregamento enquanto a página busca dado (`loading`) e uma tela amigável quando dá erro (`error`). Nenhum existe ainda.
- [ ] Analytics (ex: Vercel Analytics) — mostraria quantas pessoas visitam o site e quais produtos são mais vistos. Não existe hoje.
- [ ] Hard delete manual de produto desativado há muito tempo — hoje um produto desativado nunca é apagado de verdade, só fica invisível (`active = false`). Isso seria uma forma de apagar de vez os mais antigos, se um dia precisar.
- [ ] `.claude/skills/notion-sync/SKILL.md` descreve um comportamento que não existe mais (sync foi removido) — vale reescrever ou apagar.
- [ ] `dev.akopil.com.br` — subdomínio pra apontar pro deploy da branch `dev` na Vercel, configuração iniciada mas não concluída (falta o registro DNS na Registro.br).

## Visão geral

Catálogo de óculos de sol com duas páginas públicas (home e produto), sem checkout de pagamento. A finalização de compra é um redirect para o WhatsApp com uma mensagem pré-formatada — não existe processamento de pagamento, gateway, ou conta de cliente.

**Cadastro de produto é nativo do Supabase** — feito direto em `/admin/products` (criar, editar, excluir, controlar estoque), sem passar por nenhum sistema externo. Isso não foi sempre assim: até a Fase 4, o Notion era o CMS e um botão "Sincronizar" fazia full-resync pro Supabase. Essa arquitetura foi **aposentada** porque ela não tinha como sustentar controle de estoque em tempo real — qualquer ajuste feito fora do Notion seria sobrescrito no próximo sync, já que o Notion era sempre a fonte de verdade e o resync sempre completo. O Notion ainda serve como caminho de **migração em lote** (import de CSV+ZIP exportado de lá, ver seção Data model), mas não é mais lido em produção nem tem nenhuma integração ativa no código.

**Deploy e runtime:**

- Next.js (App Router), deploy na Vercel, domínio de produção `akopil.com.br`.
- Leitura pública (home, produto) roda em Server Components contra o Supabase — nunca expõe `SUPABASE_SECRET_KEY` ao client.
- Toda escrita (produtos, banners) passa por Route Handlers autenticados (`requireUser()` + `createAdminClient()`), nunca Server Action — ver Convenções de código.
- Estado do carrinho é client-side (Zustand + `localStorage`), sem persistência em banco; o teto de quantidade por item (`maxQuantity`) é revalidado contra o estoque real do Supabase bem antes de abrir o link do WhatsApp (ver Estrutura — Drawer do carrinho).

**Custo**: fica no free tier pro volume esperado (30-100 produtos). Único cuidado: projeto free do Supabase pausa após 7 dias sem nenhuma request.

## Stack

| Camada | Escolha | Notas |
|---|---|---|
| Framework | Next.js, App Router | Deploy na Vercel |
| Componentes de UI | shadcn/ui (base Radix, preset Nova) + lucide-react | Ver [Design system](#design-system) |
| Notificações | sonner (toast) | Única exceção com cor real (verde/vermelho) na paleta monocromática |
| Estado do carrinho | Zustand | Client-side, persistido em `localStorage` |
| Conteúdo/i18n | `locales/pt-BR.json` | Nenhuma string em português hardcoded em componente |
| Cadastro de produto | Nativo (`/admin/products`) | Sem CMS externo — Notion só serve como origem de um import CSV+ZIP opcional pra migração em lote |
| Banco de verdade | Supabase Postgres | Tabelas `products` e `banners` |
| Imagens | Supabase Storage | Bucket público `product-images` |
| Autenticação admin | Supabase Auth | Email/senha, conta única, sem multiusuário, sem OAuth |
| Checkout | Link `wa.me` | 100% client-side, sem gateway, sem processamento de cartão |

**Por que essa stack (resumo):**

- Cadastro nativo em vez de Notion: ver seção [Visão geral](#visão-geral) — controle de estoque em tempo real não é compatível com um CMS externo que sobrescreve tudo a cada sync.
- Zustand em vez de Context/Redux: carrinho é estado simples, client-only, sem necessidade de middleware.
- `wa.me` em vez de gateway de pagamento: escopo do produto é catálogo + contato comercial, não e-commerce transacional.

## Variáveis de ambiente

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
NEXT_PUBLIC_WHATSAPP_NUMBER=
```

Já configuradas no ambiente de deploy — usar exatamente esses nomes, não inventar variável nova sem necessidade clara.

- `SUPABASE_SECRET_KEY` **nunca** em código client-side — só em Route Handlers ou Server Components.
- `NEXT_PUBLIC_WHATSAPP_NUMBER` é pública por natureza (o link `wa.me` é montado no client) — formato internacional sem símbolos (ex: `5511999999999`).

`NOTION_API_KEY`/`NOTION_DATABASE_ID` existiam pro sync antigo e não são mais usadas em nenhum código — remover do ambiente de deploy quando for conveniente (ver [Status do projeto](#status-do-projeto)).

## Data model

### Tabela `products`

```sql
create table products (
  id                uuid primary key default gen_random_uuid(),
  notion_page_id    text unique,
  slug              text unique not null,
  name              text not null,
  price             numeric not null,
  discount_price    numeric,
  material          text,
  description       text,
  tags              text[] default '{}',
  images            text[] default '{}',
  active            boolean not null default true,
  best_seller       boolean not null default false,
  quantity          integer not null default 0,
  synced_at         timestamptz not null default now(),
  created_at        timestamptz not null default now()
);

create index products_active_idx on products (active);
create index products_tags_idx on products using gin (tags);
create index products_best_seller_idx on products (best_seller) where best_seller = true;

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true);
```

**Migração aplicada quando o Notion foi aposentado** (produto novo não tem mais `notion_page_id`):

```sql
alter table products add column quantity integer not null default 0;
alter table products alter column notion_page_id drop not null;
```

| Campo | Notas |
|---|---|
| `notion_page_id` | **Legado** — só produtos migrados do Notion antigo têm valor aqui. Produto criado direto no admin ou pelo import CSV/ZIP nunca preenche (`null`). Não usado por nenhum código hoje. |
| `slug` | Gerado a partir do nome (`lib/products/slug.ts`) no momento da criação (formulário ou import). Busca de produto na URL pública é sempre por `slug`, nunca por `id`. |
| `images` | URLs já no Supabase Storage, **na ordem em que foram enviadas** — não tem reordenar depois (decisão do usuário: se precisar mudar a ordem, remove e sobe de novo). Grid de produto é 2×2, mostra só o que existe. |
| `price` | Valor real/cheio do produto, sempre preenchido. Riscado quando há `discount_price`. |
| `discount_price` | `null` quando não há desconto. Quando preenchido, é o valor efetivamente cobrado (badge outline "Promoção", sem cor) — `price` some riscado ao lado. |
| `active` | `false` = produto invisível no site, sem apagar a linha. **Nunca há `DELETE`** automático — só manual, pelo botão de excluir no admin (que também limpa as fotos do Storage). Toda query pública filtra `active = true`. |
| `best_seller` | Decisão manual, direto no formulário do admin (`Switch`). Nunca calculado por heurística de vendas. Alimenta o carrossel "Mais vendidos". |
| `quantity` | Estoque. `0` = "Esgotado" (badge + botão de comprar desabilitado), `1` = "Última unidade!". Editado inline (stepper com debounce) na lista `/admin/products`. Revalidado contra o Supabase logo antes de abrir o link do WhatsApp (`GET /api/products/stock`) — se algo mudou, a sacola se ajusta e mostra o aviso em vez de abrir o link na hora (ver Estrutura — Drawer do carrinho). |
| `synced_at` | **Legado** do sync antigo — não é mais atualizado por nenhum código. Coluna mantida, mas órfã. |

### Supabase Storage — bucket `product-images`

```
product-images/
  {product_id}/
    {uuid}.jpg
```

Path mudou do antigo `{notion_page_id}/{posição}.jpg` pra `{product_id}/{uuid aleatório}.{ext}` — sem o Notion, não existe mais "posição" codificada no nome do arquivo (a ordem já é o próprio array `images`, reordenar nunca precisa renomear/mover nada no Storage). Ao criar um produto novo, o `id` é reservado no cliente (`crypto.randomUUID()`) antes de existir a linha, pra já poder subir fotos durante o cadastro.

### Tabela `banners`

Imagens do carrossel de promoções da Home, cadastradas direto no admin (upload de arquivo) — não passa pelo Notion.

```sql
create table public.banners (
  id                 uuid primary key default gen_random_uuid(),
  image_url          text not null,
  desktop_image_url  text,
  link               text,
  name               text not null,
  active             boolean not null default true,
  position           integer not null default 0,
  created_at         timestamptz not null default now()
);

create index banners_position_idx on public.banners (position);
create index banners_active_idx on public.banners (active);

alter table public.banners enable row level security;

create policy "Public read access to active banners"
on public.banners for select
to anon, authenticated
using (active = true);

grant select, insert, update, delete on public.banners to service_role;
grant select on public.banners to anon, authenticated;

insert into storage.buckets (id, name, public)
values ('banner-images', 'banner-images', true);
```

| Campo | Notas |
|---|---|
| `image_url` | URL pública no bucket `banner-images`, subida direto do admin (não vem do Notion). Usada no carrossel mobile (formato quadrado). |
| `desktop_image_url` | Opcional. Versão da mesma promoção pensada pro formato largo do carrossel desktop (`21/6`) — evita recortar uma imagem quadrada numa faixa larga. Sem ela, o desktop cai de volta pra `image_url` (recortada). Upload avulso por linha em `/admin/banners`, não faz parte do lote inicial. |
| `link` | Opcional. Vazio = imagem só decorativa; começa com `http` = link externo (`target="_blank"`); caso contrário = rota interna (`next/link`, ex: `/produto/slug`). |
| `name` | Só identifica a imagem no admin — nunca aparece como copy visível no site, só como `alt` da imagem. |
| `position` | Ordem no carrossel, controlada por drag-and-drop no admin (`/admin/banners`, desktop-only por decisão do usuário). |
| `active` | Controla o que aparece no carrossel público, sem apagar a imagem. |

Escrita sempre via `createAdminClient()` (service role) em `app/api/banners/*` — mesmo padrão de `products`/sync.

**Nota importante (custou um bug em produção — ver [Log de decisões](#log-de-decisões)):** toda tabela nova precisa de **dois passos** de permissão, não um só: a *policy* de RLS (`create policy ...`) e o **`GRANT` de tabela** (`grant select on ... to anon, authenticated`, `grant ... to service_role`). RLS sozinha não é suficiente — sem o `GRANT`, toda query falha com `permission denied for table X` (`42501`), mesmo com a policy certa. Isso já tinha acontecido com `products` na Fase 1 e se repetiu com `banners` por esse `GRANT` não estar documentado aqui antes. **Sempre incluir os dois no script de setup de qualquer tabela nova.**

### Consultas típicas do site público

- **Home / grid**: `select * from products where active = true order by created_at desc limit 16 offset :n`
- **Carrossel de mais vendidos**: `select * from products where active = true and best_seller = true`
- **Página de produto**: `select * from products where slug = :slug and active = true`
- **Estoque fresco no checkout**: `select id, quantity from products where active = true and id in (:ids)` (`/api/products/stock`, pública, sem auth)

Filtro e paginação são sempre via query (`WHERE`, `ORDER BY`, `LIMIT`/`OFFSET`) — nunca carregar o catálogo inteiro no client.

### Importação em lote (CSV + ZIP exportado do Notion)

Caminho de migração, não integração contínua — usado quando quiser cadastrar vários produtos de uma vez a partir de uma exportação do Notion (`database → ... → Export → CSV`). Roda **inteiro no navegador** (`jszip` + `papaparse`, botão "Importar do Notion" em `/admin/products`), sem nenhum parsing no servidor:

1. Admin sobe o `.zip` exportado (CSV + fotos, tudo junto — a exportação do Notion não traz URL de imagem, só o nome do arquivo, com o arquivo de verdade solto ao lado do CSV dentro do zip).
2. Colunas esperadas (formato fixo, confirmado contra uma exportação real): `Name, Ativo, Best Seller, Description, Images, Material, Original Price, Price, Quantidade, Tags`. Checkbox vira `Yes`/`No`; `Tags`/`Images` são strings separadas por vírgula. **Mapeamento invertido de propósito**: no export do Notion, `Price` é o valor cobrado e `Original Price` é o valor cheio de referência (semântica antiga) — quando `Original Price` vem preenchida, ela vira nosso `price` (real) e `Price` vira nosso `discount_price` (cobrado); quando não vem, `Price` vira `price` e não há desconto.
3. Linha com nome igual a um produto que já existe é **pulada e sinalizada** na prévia — nunca cria duplicado nem sobrescreve sozinho. Prévia mostra também quantas fotos foram encontradas de fato dentro do zip antes de confirmar.
4. Ao confirmar, só as linhas válidas: gera `id`+`slug`, sobe cada foto referenciada (busca o arquivo exato dentro do zip já carregado em memória) via `/api/products/upload`, na ordem que aparece na célula `Images`, depois cria todos de uma vez via `POST /api/products`.

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

Header → carrossel "Mais vendidos" (scroll horizontal, `best_seller = true`) → Grid de produtos (imagem, nome, tags, preço; 4 colunas desktop / 2 mobile, infinite scroll em lotes de ~16) → Footer. Produto com `quantity = 0` mostra um rótulo "Esgotado" em cima da própria foto (canto superior esquerdo, fundo `bg-muted`/texto `text-muted-foreground` — cinza claro, dentro da paleta monocromática); `quantity = 1` mostra "Última unidade!" como badge inline ao lado do preço (não sobre a foto — decisão do usuário: só o esgotado precisa do destaque visual mais forte).

Filtros (pills "Todos" + material/tag) faziam parte do design original mas **não foram implementados** — removidos do escopo por decisão do usuário. Se retomados: lista de opções sempre via `select distinct` contra `products`, nunca uma lista fixa no código.

### Estrutura — Produto

Duas colunas (empilha no mobile): grid 2×2 de fotos à esquerda (carrossel de 1 foto no mobile, lightbox em tela cheia no desktop) — `quantity = 0` mostra "Esgotado" sobre a primeira foto (mesmo rótulo do card da Home), já que a galeria tem várias fotos e não uma capa única; à direita eyebrow, nome, preço (+ riscado e badge "Promoção" quando há `discount_price`, + badge "Última unidade!" quando `quantity = 1`), campo Material, campo Tags (pills), descrição curta, e um botão único "Adicionar ao carrinho" (adiciona + abre o drawer; `disabled` quando `quantity = 0`).

### Estrutura — Drawer do carrinho

Painel deslizante da direita (`Sheet` do shadcn), não é rota própria. Cabeçalho "Sacola" com fechar, lista de itens (miniatura, nome, preço, stepper de quantidade — botão "+" desabilita ao atingir `maxQuantity`, o estoque congelado no momento em que o item entrou no carrinho —, remover), subtotal, dois botões (`Continuar comprando` outline / `Finalizar compra` sólido).

"Finalizar compra" não é mais um link direto — é um botão que primeiro busca o estoque fresco de todos os itens (`GET /api/products/stock`), ajusta a sacola se algo mudou (reduz quantidade ou remove item zerado) e, **se algo mudou, só mostra o aviso e para** (não abre o WhatsApp nessa tentativa — decisão fechada com o usuário: nunca mandar a mensagem silenciosamente com um item que já esgotou). Só abre o link `wa.me` quando a revalidação não muda nada.

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
- **Valor total** = soma de `price` de cada item (valor real/cheio). **Valor com desconto** = soma de `discount_price ?? price`.
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

- `app/` — rotas (home, `[slug]` de produto, `/admin`, route handlers).
- `components/ui/` — componentes gerados pela CLI do shadcn, não editar a lógica interna.
- `components/` (raiz) — composições próprias com peças do shadcn.
- `lib/supabase/` — clients server-safe (`server.ts`), admin/service-role (`admin.ts`), e `require-user.ts` (helper de auth reusado por toda rota autenticada).
- `lib/products/` — `slug.ts` (geração de slug único), `storage.ts` (upload/delete de foto no bucket `product-images`), `queries.ts`, `format-price.ts`.
- `lib/banners/` — mesmo padrão de `lib/products/`, pro bucket `banner-images`.
- `store/` — Zustand store do carrinho.
- `locales/pt-BR.json` — todo texto visível ao usuário.

## Escopo — o que este produto não é

- Não é e-commerce com checkout de pagamento.
- Não tem conta de cliente (só login único de admin).
- Não tem CMS externo — cadastro de produto e banner são 100% nativos do admin.

## Decisões fechadas — não reabrir sem o usuário pedir

- Radius único `6px` em tudo.
- Paleta 100% monocromática, nenhuma cor de destaque em nenhum estado.
- Toda escrita (produtos, banners) é Route Handler autenticado (`requireUser()` + `createAdminClient()`), nunca Server Action — upload de arquivo não tem precedente de Server Action nesse projeto, e manter um padrão só evita duas convenções de chamada diferentes.
- `best_seller` é sempre decisão manual (`Switch` no admin, era checkbox no Notion antes). Nunca calculado por heurística de vendas.
- Mensagem do WhatsApp sempre agrega todos os itens do carrinho, nunca por item individual.
- Filtros de material/tag removidos do escopo (Fase 2) — não reimplementar sem pedido explícito. Tags/material são texto livre no admin (sem lista fixa/autocomplete) — decisão explícita, aceita o risco de digitação inconsistente.
- Um botão só na página de produto ("Adicionar ao carrinho", que já abre o drawer) — "Abrir agora" foi removido por ser redundante.
- CTA de "adicionar ao carrinho" direto no card do grid foi considerado e rejeitado (hover não existe em touch, mobile é prioridade) — só as tags do produto foram mantidas no card.
- Fotos de produto **não têm reordenar** depois de enviadas — a ordem é sempre a ordem de upload (manual) ou a ordem da célula `Images` do CSV (import). Pra mudar, remove e sobe de novo.
- Checkout sempre bloqueia e mostra o ajuste quando o estoque muda entre montar a sacola e clicar em "Finalizar compra" — nunca ajusta e segue direto pro WhatsApp silenciosamente.
- Versionamento do projeto segue [SemVer](https://semver.org/lang/pt-BR/), a partir de `1.0.0` (ver [`CHANGELOG.md`](CHANGELOG.md)).

## Log de decisões

Entradas novas de decisão de produto/arquitetura entram aqui, mais recente primeiro. Detalhe de implementação (o que mudou em código) vai no [`CHANGELOG.md`](CHANGELOG.md).

### 2026-09-04

- Consolidação de documentação: pasta `docs/` (10 arquivos, com bastante duplicação com `.claude/skills/`) apagada, substituída por este arquivo único (`documentation.md`) na raiz. `README.md` reescrito com conteúdo real do projeto; versionamento (SemVer) adotado a partir de `1.0.0`; `CHANGELOG.md` criado.

### 2026-09-05 — Banner de imagens de promoções

- UX desenhada e validada com o usuário via protótipo HTML interativo (`scratch/banners-admin-mockup.html`, publicado como Artifact, várias rodadas de feedback) antes de qualquer código real — fluxo de upload em modal (dropzone multi-arquivo, nome sugerido a partir do arquivo e editável assim que o upload termina, confirmação em lote), drag-and-drop **desktop-only** na lista do admin (decisão explícita: admin é usado no computador, público final é majoritariamente mobile).
- Planejado em plan mode (2 agentes Explore + 1 agente Plan) antes de implementar, reaproveitando os padrões exatos já existentes (upload pro Storage de `lib/sync/images.ts`, Route Handler de `app/api/sync/route.ts`, `Carousel`/`Dialog` de `product-photos.tsx`). Três decisões de UX fechadas com o usuário antes do plano final: progresso de upload é só shimmer indeterminado (sem XHR, o projeto só usa `fetch`), exclusão de banner pede confirmação (`AlertDialog`, apaga o arquivo do Storage de vez), carrossel público é formato hero/largo (`basis-full`, `AspectRatio` `21/6`) — diferente dos cards de "Mais vendidos".
- Implementado: tabela `banners` + bucket `banner-images`; `lib/banners/` (queries + storage helper); `app/api/banners/*` (upload, criação em lote, edição/exclusão por id, reorder) como Route Handlers (não Server Action — primeiro upload de arquivo binário do projeto, sem precedente de Server Action pra isso); admin `/admin/banners` (`banners-manager.tsx` dono do estado, `banner-list.tsx` com `@dnd-kit`, `banner-row.tsx`, `upload-dialog.tsx` com o componente `Attachment` do shadcn — resolveu direto via `npx shadcn add attachment`, sem precisar montar à mão); `BannerCarousel` na Home.
- **Bug encontrado no `npx shadcn@latest add`**: os 3 componentes novos instalados (`switch`, `alert-dialog`, `attachment`) vieram importando `cn` do pacote npm `cn` em vez de `@/lib/utils` (que já tem o `cn` do projeto, via `clsx`+`tailwind-merge`) — um desalinhamento entre a versão mais nova da CLI do shadcn (resolvida via `npx`, sem estar pinada no projeto) e o `components.json` já configurado (alias `utils: "@/lib/utils"`). Corrigido nos 3 arquivos e o pacote `cn` desinstalado — se isso acontecer de novo ao instalar componente novo do shadcn, conferir os imports antes de dar como pronto.
- **Bug de dado real, mesma causa-raiz já vista na Fase 1 com `products`**: RLS sozinha não bastou pra tabela `banners` nova — faltava o `GRANT` de tabela (`grant select on ... to anon, authenticated`), então toda leitura pública quebrava com `permission denied for table banners` (`42501`), mesmo com a policy certa. Esse `GRANT` não estava no SQL do plano original porque a informação só existia no log de sessões antigo (apagado na consolidação da documentação) — adicionado de volta aqui, na seção [Data model](#data-model), como nota permanente pra qualquer tabela nova futura.
- Build e lint rodados a cada etapa. Um erro de lint real pego nesse processo: `react-hooks/set-state-in-effect` no hook de debounce de nome/link (`banner-row.tsx`) — `useEffect(() => setLocal(value), [value])` pra ressincronizar estado local quando a prop muda é exatamente o padrão que essa regra proíbe; corrigido pro padrão recomendado pelo React (ajustar o estado durante o render, comparando com o valor anterior guardado, em vez de useEffect).
- Verificação: `npm run build`/`npm run lint` limpos, as 5 rotas novas (`/api/banners*`) devolvem `401` sem cookie de sessão, Home confirmada carregando sem erro depois do fix de `GRANT` (seção do carrossel corretamente ausente com 0 banners cadastrados). Usuário testou o fluxo completo do admin de verdade (upload, reordenar, editar, excluir) — funcionou.
- **Ajuste pós-teste com dado real**: usuário subiu uma imagem 1:1 de teste e viu o carrossel do desktop (formato `21/6`) cortando a imagem de forma feia (topo/base sumindo). Em vez de forçar um recorte único pra dois formatos bem diferentes (quadrado no mobile, faixa larga no desktop), adicionada coluna opcional `desktop_image_url` — cada banner pode ter uma segunda imagem pensada pro formato widescreen. Decisão de UX fechada com o usuário: **não** virou um segundo upload obrigatório nem mudou o modal em lote já testado — cada linha da lista em `/admin/banners` ganhou um botão pequeno opcional "Adicionar versão desktop" (ícone `Monitor`, upload avulso reusando a mesma rota `/api/banners/upload`); sem preencher, o desktop cai de volta pra `image_url` recortada (comportamento anterior, nunca quebra). Carrossel público (`banner-carousel.tsx`) agora renderiza duas `<Image>` (uma `catalog:hidden` quadrada, outra `hidden catalog:block` larga) em vez de uma única `div` com `aspect-*` responsivo — mesmo padrão de blocos mobile/desktop separados já usado em `product-photos.tsx`.

### 2026-09-12 — Aposentar o Notion: cadastro nativo, estoque e import CSV/ZIP

- **Motivação**: usuário queria controle de quantidade em estoque, e percebeu que isso não funciona bem com o Notion sendo sempre a fonte de verdade (qualquer desconto de estoque feito fora do Notion seria apagado no próximo full-resync). Decisão discutida e fechada: aposentar o Notion de vez, cadastro de produto vira nativo do admin (mesmo padrão da feature de banners), quantidade é campo nativo do Supabase.
- Antes de planejar, o usuário pediu pra eu adicionar o campo "Quantidade" (número) na database do Notion via MCP, exportar como CSV+ZIP, e mandar o arquivo real — isso revelou um detalhe importante que mudou o plano: a coluna `Images` do export **não traz URL**, só o nome do arquivo — as fotos de verdade ficam soltas dentro do mesmo zip, ao lado do CSV. Migração em lote por isso precisa do zip inteiro (CSV + fotos), não só do CSV.
- Planejado em plan mode (2 agentes Explore + 1 agente Plan) reaproveitando os padrões da feature de banners inteiros (Route Handler + `requireUser()`, upload por arquivo, `AlertDialog`, `Switch`, debounce visual-instantâneo). Decisões de UX fechadas com o usuário antes do plano final: checkout **bloqueia e mostra o ajuste** quando o estoque muda entre montar a sacola e finalizar (nunca ajusta e segue direto pro WhatsApp); fotos de produto **sem reordenar** — a ordem é sempre a ordem de upload ou a ordem da célula `Images` do CSV, sem setas nem drag-and-drop (simplificação pedida pelo usuário depois de eu sugerir arrastar-e-soltar); Material/Tags ficam texto livre (mesmo formato do CSV), sem lista fixa.
- Implementado: `quantity` + `notion_page_id` opcional em `products`; `lib/products/slug.ts` (portado de `lib/sync/slug.ts`, mesmo algoritmo) e `lib/products/storage.ts` (upload por produto, path `{product_id}/{uuid}.ext` — mudou do antigo `{notion_page_id}/{posição}.jpg` porque a ordem agora vive só no array `images`, nunca no nome do arquivo); `app/api/products/*` (upload, criação em lote, edição/exclusão por id, e uma rota **pública** `/api/products/stock` pra revalidar estoque no checkout); admin `/admin/products` completo (lista com quantidade editável inline via stepper debounced, formulário de página cheia pra criar/editar — não modal, campo demais pros 9+ campos do produto —, `image-manager.tsx` com até 4 fotos sem reordenar); import CSV+ZIP **inteiro no navegador** (`jszip` + `papaparse`, sem nenhum parsing no servidor — o zip não tem segredo nenhum), com prévia antes de confirmar e duplicata por nome pulada e sinalizada.
- Estoque no site: badge "Esgotado"/"Última unidade!" (produto e card), `CartItem` ganhou `maxQuantity` (teto no stepper do carrinho), nova action `syncStock` na store revalida e ajusta a sacola. "Finalizar compra" deixou de ser link direto — vira um botão que busca estoque fresco, ajusta se preciso, e só abre o WhatsApp se nada mudou nessa tentativa.
- Removido por completo: `lib/notion/`, `lib/sync/` (exceto `slug.ts`, portado antes de apagar), `app/api/sync/route.ts`, `app/admin/(protected)/sync-button.tsx`, dependência `@notionhq/client`, dashboard reescrito (sem card/botão de sync, com contagem de produtos/ativos/sem-estoque). `NOTION_API_KEY`/`NOTION_DATABASE_ID` continuam no ambiente de deploy por enquanto — remover fica pendente (ver [Status do projeto](#status-do-projeto)), não mexi no ambiente por conta própria.
- **Mesmo bug do `npx shadcn@latest add` de novo** (`textarea`, `table` também vieram importando `cn` do pacote errado) — corrigido do mesmo jeito, pacote `cn` desinstalado de novo.
- **Achado fora do escopo, não corrigido**: `npm audit` acusou uma vulnerabilidade **crítica** de RCE no `next@16.3.1` já instalado (não introduzida por este trabalho) — fica registrado em [Status do projeto](#status-do-projeto), upgrade precisa de confirmação do usuário antes (pode ter breaking change, e o próprio `AGENTS.md` do projeto avisa que versões novas do Next mudam convenção).
- Verificação: `npm run build`/`npm run lint` limpos depois de limpar o cache stale do `.next` (apontava pra rota de sync já apagada). `curl` sem cookie confirma `401` nas rotas autenticadas novas e `200` nas públicas (`/api/products`, `/api/products/stock`).
- Usuário rodou a migração SQL; confirmado sem login (parte pública, não precisa de sessão): Home e página de produto renderizando certo com o novo campo (todo produto começa com `quantity = 0` → badge "Esgotado" e botão de comprar desabilitado em tudo, como esperado antes de qualquer admin ajustar estoque de verdade). Fluxo completo com estoque real (última unidade, teto no carrinho, revalidação no checkout) e o CRUD do admin (criar produto, importar CSV) ainda não verificados — dependem do login real do usuário.
- **Ajustes de UX pedidos depois de olhar a tela**: formulário de criar/editar centralizado (`mx-auto`, estava colado na esquerda), link "Voltar" no topo do formulário, e as rotas `new`/`[id]` viraram uma só (`app/admin/(protected)/products/[id]/page.tsx` — `id === "new"` entra em modo criação sem buscar produto; `id` de verdade busca e faz `notFound()` se não existir). `product-form.tsx` continua sendo o único lugar com a lógica/UI do formulário, como já era.
- **Lista de produtos virou tabela de verdade** (pedido do usuário, inspirado na tela de produtos da Nuvemshop): `shadcn/ui Table` com colunas Produto/Estoque/Preço/Promocional/Ações. Miniatura maior (clicar **amplia** num `Dialog`, não edita); clicar no **nome** é que leva pra edição. Estoque, Preço e Promocional (`original_price`) viraram 3 inputs numéricos editáveis inline (mesmo padrão debounced de antes, generalizado num hook único), sem mais stepper `+`/`-`. Coluna "Ativo" saiu da lista — só existe dentro da edição (decisão do usuário: lista fica mais limpa, ativar/desativar não é ação do dia a dia igual estoque/preço).
- **Duplicar produto**: botão novo na lista (`Copy`, ao lado de editar), `POST /api/products/[id]/duplicate` — copia todos os campos, **copia os arquivos de imagem de verdade no Storage** (não só a URL — apontar duas linhas pro mesmo arquivo quebraria a outra se uma fosse excluída depois, via `storage.copy()` + `lib/products/storage.ts#copyProductImages`), gera slug novo (`resolveUniqueSlug`, mesmo nome colide e ganha sufixo), nome recebe sufixo " (cópia)", e a cópia nasce **inativa e com estoque zero** até o admin revisar. Redireciona direto pra edição da cópia.
- **Paginação adicionada em `/admin/products`** (pedido do usuário depois de perceber que a lista carregava o catálogo inteiro de uma vez, igual banners): `page.tsx` lê `page`/`pageSize` da URL (`searchParams`), busca só a fatia certa via `.range()` + `count: "exact"`, componente `pagination-controls.tsx` (`Select` do shadcn pra 30/50/100, botões anterior/próxima). Como a lista de produtos agora é só uma página, a checagem de duplicata/slug do import CSV precisa do catálogo **inteiro** — `page.tsx` busca à parte um `select("id, name, slug")` sem `range` (leve, sem custo real até milhares de linhas) e passa separado da lista paginada.

### 2026-09-13 — Ambiente de dev separado + `original_price` renomeado pra `discount_price`

- **Ambiente de dev**: usuário já tem produtos reais em produção (via Notion, antes do sync ser aposentado) e não queria mais testar mudanças de admin contra o banco de prod. Decisão: segundo projeto Supabase (plano free, sem custo) em vez de Supabase Branching (pago, exige plano Pro) — projeto novo com o mesmo schema, populado do zero (não é cópia de prod). `.env.development.local` criado (Next.js carrega com prioridade sobre `.env.local` durante `npm run dev`, sem tocar no arquivo que aponta pra prod); SQL de setup completo (schema `products`+`banners`, RLS, GRANT, buckets) preparado — falta o usuário criar o projeto e rodar.
- **`price`/`original_price` tinham o papel invertido do que faz sentido pro usuário**: antes, `price` era o valor cobrado (menor, quando em promoção) e `original_price` era só o valor de referência riscado. Usuário pediu o oposto: `price` = valor real/cheio (sempre preenchido, sempre a referência quando riscado), e o valor cobrado em promoção vira um campo à parte. Resolvido renomeando a coluna pra `discount_price` (mais claro que só trocar o rótulo) e invertendo a lógica de exibição/cálculo em todo lugar que usava os dois campos: card e página do produto (o riscado agora é `price`, o valor mostrado é `discount_price ?? price`), carrinho (`store/cart.ts` ganhou `cartItemUnitPrice()`, subtotal/checkout usam isso em vez de `item.price` puro), mensagem do WhatsApp (`Valor total` = soma de `price`, `Valor com desconto` = soma do preço efetivo), formulário/lista do admin (label "Desconto"), rota de duplicar produto, e o import CSV — que precisou de mais que renomear: a planilha do Notion ainda usa a semântica antiga (coluna `Price` = cobrado, `Original Price` = referência cheia), então o parser inverte na hora de mapear pro schema novo (`Original Price` preenchida vira `price`, `Price` vira `discount_price`; sem `Original Price`, `Price` vira `price` sem desconto).
- **Migração de dado represada, não aplicada ainda**: como já existem produtos reais em produção com desconto ativo (`original_price` preenchido), só renomear a coluna trocaria o preço exibido pro cliente sem querer — por isso a migração de prod (`alter table ... rename column`, seguida de um `update` que troca os valores de `price`/`discount_price` só nas linhas que têm desconto) fica separada do schema de dev (que já nasce com o nome certo, sem dado nenhum pra trocar) e só deve rodar em produção depois de validado no ambiente de dev.
- **Badge "Esgotado"/"Última unidade!" ficavam pouco visíveis** (badge outline pequeno ao lado do preço) — usuário pediu mais destaque, com cor: laranja pra "Última unidade!", cinza claro pra "Esgotado", em cima da própria foto. Isso reabre a decisão fechada de paleta 100% monocromática — mas só parcialmente: depois de ver o resultado, o usuário decidiu manter só o "Esgotado" em cima da foto (rótulo cinza claro, dentro dos tokens já existentes — `bg-muted`/`text-muted-foreground`, sem cor nova) e reverter "Última unidade!" pro badge inline de antes, ao lado do preço. **Não foi introduzida nenhuma cor nova na paleta** no final — cheguei a adicionar um token `--warning` (laranja) pra essa primeira versão, mas removi de novo quando o usuário recuou da ideia pro "Última unidade!". Card (Home/grid) mostra "Esgotado" no canto superior esquerdo da foto; página de produto mostra o mesmo rótulo só na primeira foto (grid 2×2 desktop / primeiro slide do carrossel mobile), já que ali não existe uma "capa" única como no card — `ProductPhotos` ganhou a prop `outOfStock`.
- **Achado no processo, não relacionado ao pedido**: `app/globals.css` zera a paleta de cores padrão do Tailwind de propósito (`--color-*: initial`, comentário explica: evita cor "fora da marca" tipo `blue-500` vazar sem querer) — por isso `bg-orange-500` e afins simplesmente não geram CSS nenhum nesse projeto (não é bug de cache do Turbopack, ao contrário do que pareceu à primeira vista). Qualquer cor nova de verdade precisa virar um token explícito em `:root`/`.dark` + mapeamento em `@theme inline`, nunca uma classe crua do Tailwind.

### 2026-09-13 — Fluxo de branch/PR adotado e migração de produção concluída

- **Fluxo de git formalizado**: branch `dev` criada no GitHub como intermediária entre trabalho em andamento e `main` (produção) — daqui pra frente, trabalho novo nasce numa branch `feature/*`, PR pra `dev`, valida lá, depois PR de `dev` pra `main` promove pra produção. "Automatically delete head branches" ativado no repositório, então toda branch de feature some sozinha depois do merge.
- **Migração de preço em duas etapas, sem downtime**: a troca `original_price` → `discount_price` (ver entrada anterior) rodou em produção como **expand/contract** em vez de um rename+swap só — etapa 1 (`alter table products add column discount_price numeric`) rodada antes do deploy, sem nenhum risco pro site no ar; etapa 2 (trocar os valores dos produtos com desconto + `drop column original_price`) só depois de confirmar o deploy novo já servindo produção. Evita a janela em que código e schema ficariam fora de sincronia (código velho quebrando contra coluna renomeada, ou código novo lendo uma coluna que ainda não existe).
- **Tudo confirmado no ar em produção** pelo usuário: cadastro nativo de produto, estoque, badges, Preço/Desconto, e a importação em lote. Trabalho desta sessão está concluído — pendências que restam (RCE do Next.js, `dev.akopil.com.br`, limpeza de env vars do Notion) estão listadas em [Status do projeto](#status-do-projeto).
