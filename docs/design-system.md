# Akopil — Design system

Fonte de verdade: [akopil-layout.md](akopil-layout.md) (seção 1) e o mockup navegável [akopil-layout-mockup.html](akopil-layout-mockup.html) — para a intenção visual (o que cada tela deve parecer). A implementação concreta desde a Fase 1 usa **shadcn/ui** (ver seção abaixo), não CSS/classes escritas à mão. Este documento é a referência humana; a versão que o Claude Code carrega automaticamente ao gerar componentes está em [design-system (skill)](../.claude/skills/design-system/SKILL.md).

## Princípio

Paleta **100% monocromática** — preto, branco, cinza. Nenhuma cor de destaque em nenhum estado, inclusive promoção (comunicada só via riscado + badge outline). Essa é uma restrição de marca, não um placeholder — não introduzir cor "temporariamente".

**Exceção deliberada**: toasts de feedback (sucesso/erro) usam verde/vermelho de verdade — decisão explícita do usuário para esse caso específico, não uma reabertura da regra geral. Fora de toasts de status, a regra monocromática vale.

## Componentes — sempre shadcn/ui

Todo componente de UI (botão, card, input, sidebar, badge, etc.) é construído com [shadcn/ui](https://ui.shadcn.com) (`npx shadcn@latest add <nome>`), base Radix, preset Nova — nunca CSS/classes customizadas à mão quando existe um componente shadcn equivalente. Se um componente necessário não existir no registry, perguntar ao usuário antes de construir algo customizado (não assumir). Componentes já instalados vivem em `components/ui/` (gerados pela CLI, não editar a lógica interna deles — só os tokens em `app/globals.css` que eles consomem); composições próprias (como a sidebar do admin) ficam direto em `components/`.

Inicialização feita com a flag `--pointer`, que já aplica `cursor: pointer` em todo `<button>`/`[role=button]` habilitado globalmente (e cursor padrão nos desabilitados) — não é necessário adicionar `cursor-pointer` manualmente.

## Tokens

O preset do shadcn usa nomes semânticos (`background`, `foreground`, `primary`, `border`, etc.), remapeados em `app/globals.css` para os hex exatos do Akopil — não os cinzas genéricos do preset:

| Token shadcn | Valor | Equivale a | Uso |
|---|---|---|---|
| `--background` / `--card` / `--popover` | `#ffffff` | branco | Fundo geral, cards, popovers |
| `--foreground` / `--card-foreground` / `--primary` | `#111111` | preto | Texto, botões sólidos, bordas de destaque |
| `--primary-foreground` | `#ffffff` | branco | Texto sobre botão sólido |
| `--secondary` / `--muted` / `--accent` | `#f5f5f5` | gray-1 | Fundos secundários, hover, placeholders |
| `--muted-foreground` | `#525252` | gray-4 | Texto secundário (labels, preço em cinza) |
| `--border` / `--input` | `#e5e5e5` | gray-2 | Bordas neutras, divisores |
| `--ring` | `#111111` | preto | Anel de foco — nunca azul/colorido |
| `--sidebar` | `#f5f5f5` | gray-1 | Fundo da sidebar do admin |
| `--radius` | `0.375rem` (`6px`) | — | Radius único |

Não existe token equivalente a `gray-3` (`#a3a3a3`, texto terciário/riscado) no preset shadcn ainda — ao precisar dele (ex: preço riscado na Fase 3), adicionar como token novo em `:root`, não usar uma cor solta.

## Radius

Único valor (`6px`, via `--radius`) em toda superfície com borda — fotos, botões, pills, badge, drawer. Nada totalmente arredondado (pill/cápsula), nada totalmente quadrado. Essa unificação já foi decidida (pills e badge começaram em `100px` e foram revertidos para `6px`) — não reabrir.

Tecnicamente, isso é garantido em `app/globals.css`: a escala inteira de radius do Tailwind (`--radius-sm` até `--radius-4xl`) foi achatada para todas resolverem em `var(--radius)` — então não importa qual classe (`rounded-md`, `rounded-lg`, `rounded-xl`...) um componente shadcn use por padrão, o resultado visual é sempre `6px`.

## Tipografia

Uma família só (Inter no mockup, grotesco). Hierarquia por peso:

| Peso | Uso |
|---|---|
| 900 | Logo |
| 700 | Títulos, texto de botão/CTA |
| 500 / 400 | Corpo, labels, texto secundário |

## Estrutura — Home

1. **Header** — logo `AKOPIL`, nav (Catálogo / Sobre), ícone de carrinho com contador; clique abre o drawer.
2. **Mais vendidos** — carrossel horizontal (scroll, sem paginação), filtra `best_seller = true`.
3. **Filtros** — pills por material/tag + "Todos". Pill ativa preenche em preto. Lista de materiais/tags é sempre dinâmica (valores distintos de `products` no Supabase, vindos do Notion) — nunca uma lista fixa no código; ver [data-model.md](data-model.md).
4. **Grid de produtos** — 4 colunas desktop / 2 mobile. Card: imagem, nome, preço (riscado quando há `original_price`). Infinite scroll em lotes de ~16.
5. **Footer** — logo, atalho WhatsApp, copyright.

## Estrutura — Produto

Duas colunas (empilha no mobile):

- **Esquerda**: grid 2×2 de fotos.
- **Direita**: eyebrow ("Óculos de sol"), nome, preço (+ riscado e badge "Promoção" quando aplicável), campo Material, campo Tags (pills), descrição curta, dois botões lado a lado:
  - `Adicionar ao carrinho` (outline) — adiciona o item, permanece na página.
  - `Abrir agora` (preto sólido) — adiciona o item e abre o drawer na hora.

## Estrutura — Drawer do carrinho

Painel deslizante da direita, acionável de qualquer página (ícone do carrinho, ou botão "Abrir agora"). Não é uma rota própria.

- Cabeçalho "Sacola" com botão de fechar.
- Lista de itens: miniatura, nome, preço, remover.
- Subtotal.
- Dois botões: `Continuar comprando` (outline, fecha o drawer sem perder o carrinho) / `Finalizar compra` (sólido, monta a mensagem do WhatsApp — ver [i18n-content](../.claude/skills/i18n-content/SKILL.md)).

## Componentes reutilizados entre páginas

Nomes abaixo (`.btn-solid`, `.pill`, etc.) descrevem a intenção visual do mockup original — a implementação usa os componentes shadcn equivalentes (`Button` com `variant="default"`/`"outline"` no lugar de `.btn-solid`/`.btn-outline`, `Badge` no lugar de `.pill`), não classes CSS customizadas.

- Header — idêntico em home e produto
- Footer — idêntico em home e produto
- Botão sólido/outline — produto e drawer
- Pill (material/tag) — filtros da home e tags do produto
- Drawer do carrinho — global, independente de onde foi aberto (avaliar `Sheet` do shadcn, já instalado, em vez de construir do zero)

## Referência de implementação

O mockup [akopil-layout-mockup.html](akopil-layout-mockup.html) é navegável e contém CSS completo (breakpoint `860px`, espaçamentos, aspect-ratio das imagens). Usar como referência pixel-a-pixel antes de divergir por conta própria — qualquer ajuste visual não coberto por ele é decisão nova, perguntar antes de assumir.
