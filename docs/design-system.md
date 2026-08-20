# Akopil — Design system

Fonte de verdade: [akopil-layout.md](akopil-layout.md) (seção 1) e o mockup navegável [akopil-layout-mockup.html](akopil-layout-mockup.html). Este documento é a referência humana; a versão que o Claude Code carrega automaticamente ao gerar componentes está em [design-system (skill)](../.claude/skills/design-system/SKILL.md).

## Princípio

Paleta **100% monocromática** — preto, branco, cinza. Nenhuma cor de destaque em nenhum estado, inclusive promoção (comunicada só via riscado + badge outline). Essa é uma restrição de marca, não um placeholder — não introduzir cor "temporariamente".

## Tokens

| Token | Valor | Uso |
|---|---|---|
| `--black` | `#111111` | Texto, botões sólidos, bordas de destaque |
| `--white` | `#ffffff` | Fundo geral |
| `--gray-1` | `#f5f5f5` | Fundo de placeholders de imagem |
| `--gray-2` | `#e5e5e5` | Bordas neutras, divisores |
| `--gray-3` | `#a3a3a3` | Texto terciário (preço riscado, placeholders) |
| `--gray-4` | `#525252` | Texto secundário (labels, preço em cinza) |
| `--radius` | `6px` | Radius único, aplicado em tudo |

## Radius

Único valor (`6px`) em toda superfície com borda — fotos, botões, pills, badge, drawer. Nada totalmente arredondado (pill/cápsula), nada totalmente quadrado. Essa unificação já foi decidida (pills e badge começaram em `100px` e foram revertidos para `6px`) — não reabrir.

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

- Header — idêntico em home e produto
- Footer — idêntico em home e produto
- `.btn` / `.btn-outline` / `.btn-solid` — produto e drawer
- `.pill` — filtros da home e tags do produto
- Drawer do carrinho — global, independente de onde foi aberto

## Referência de implementação

O mockup [akopil-layout-mockup.html](akopil-layout-mockup.html) é navegável e contém CSS completo (breakpoint `860px`, espaçamentos, aspect-ratio das imagens). Usar como referência pixel-a-pixel antes de divergir por conta própria — qualquer ajuste visual não coberto por ele é decisão nova, perguntar antes de assumir.
