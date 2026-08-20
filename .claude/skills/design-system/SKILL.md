---
name: design-system
description: Design tokens, radius, tipografia e componentes reutilizáveis do Akopil. Ler antes de gerar qualquer componente visual, página ou estilo.
---

# Design system — Akopil

Fonte de verdade: [`docs/akopil-layout.md`](../../../docs/akopil-layout.md) (seção 1) e [`docs/akopil-layout-mockup.html`](../../../docs/akopil-layout-mockup.html).

## Regra inegociável

Paleta **100% monocromática** — preto, branco, cinza. Nenhum estado (hover, ativo, erro, promoção, disabled) introduz cor de destaque. Promoção é comunicada só por texto riscado + badge outline preto/branco.

## Tokens

| Token | Valor | Uso |
|---|---|---|
| `--black` | `#111111` | Texto, botões sólidos, bordas de destaque |
| `--white` | `#ffffff` | Fundo geral |
| `--gray-1` | `#f5f5f5` | Fundo de placeholders de imagem |
| `--gray-2` | `#e5e5e5` | Bordas neutras, divisores |
| `--gray-3` | `#a3a3a3` | Texto terciário (preço riscado, placeholders) |
| `--gray-4` | `#525252` | Texto secundário (labels, preço em cinza) |
| `--radius` | `6px` | Radius único, aplicado em **tudo** |

## Radius

`6px` em toda superfície com borda — fotos, botões, pills, badges, drawer. Nunca `border-radius: 50%`/pill totalmente redondo, nunca `0` totalmente quadrado. Isso já foi decidido e revertido uma vez (pills e badge começaram em `100px` e foram unificados) — não reabrir essa decisão sem o usuário pedir explicitamente.

## Tipografia

Uma família só: Inter (grotesco). Hierarquia por peso, não por família:
- `900` — logo
- `700` — títulos, texto de botão (CTA)
- `500` / `400` — corpo, labels, texto secundário

## Componentes reutilizados entre páginas

- Header — idêntico em home e produto (logo `AKOPIL`, nav Catálogo/Sobre, ícone de carrinho com contador que abre o drawer)
- Footer — idêntico em home e produto (logo, atalho WhatsApp, copyright)
- `.btn` / `.btn-outline` / `.btn-solid` — usados na página de produto e no drawer do carrinho
- `.pill` — usado nos filtros da home (material/tag) e nas tags da página de produto
- Drawer do carrinho — global, acionável de qualquer página, não é uma rota própria

## Layout — Home

Ordem vertical fixa: Header → carrossel "Mais vendidos" (scroll horizontal, sem paginação, filtra `best_seller = true`) → Filtros (pills, "Todos" + material/tag, pill ativa preenche em preto) → Grid de produtos (4 colunas desktop / 2 mobile, infinite scroll em lotes de ~16) → Footer.

## Layout — Produto

Duas colunas (empilha no mobile): grid 2×2 de fotos à esquerda; à direita eyebrow, nome, preço (+ riscado e badge "Promoção" quando há `original_price`), campo Material, campo Tags (pills), descrição curta, e dois botões lado a lado (`Adicionar ao carrinho` outline / `Abrir agora` sólido).

## Layout — Drawer do carrinho

Painel deslizante da direita, não é página. Cabeçalho "Sacola" com fechar, lista de itens (miniatura, nome, preço, remover), subtotal, dois botões (`Continuar comprando` outline / `Finalizar compra` sólido).

Use o mockup navegável como referência pixel-a-pixel de espaçamento, breakpoints (`860px`) e estrutura de markup antes de divergir por conta própria.
