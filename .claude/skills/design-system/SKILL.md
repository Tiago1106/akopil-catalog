---
name: design-system
description: Design tokens, radius, tipografia e componentes reutilizáveis do Akopil. Ler antes de gerar qualquer componente visual, página ou estilo.
---

# Design system — Akopil

Fonte de verdade: [`docs/akopil-layout.md`](../../../docs/akopil-layout.md) (seção 1) e [`docs/akopil-layout-mockup.html`](../../../docs/akopil-layout-mockup.html) para a intenção visual. A implementação concreta é sempre **shadcn/ui** — ver seção "Componentes" abaixo antes de escrever qualquer JSX de UI.

## Regra inegociável

Paleta **100% monocromática** — preto, branco, cinza. Nenhum estado (hover, ativo, erro, promoção, disabled) introduz cor de destaque. Promoção é comunicada só por texto riscado + badge outline preto/branco.

**Exceção deliberada**: toasts de sucesso/erro (sonner) usam verde/vermelho reais — pedido explícito do usuário, só pra esse caso. Não generalizar essa exceção pra outros componentes.

## Componentes — sempre shadcn/ui

Todo componente novo de UI usa [shadcn/ui](https://ui.shadcn.com) (`npx shadcn@latest add <nome>`), base Radix, preset Nova. **Nunca escrever CSS/classes customizadas à mão quando existe um componente shadcn equivalente.** Se o componente necessário não existir no registry, parar e perguntar ao usuário antes de construir algo customizado — não assumir e seguir.

Componentes instalados ficam em `components/ui/` (não editar a lógica interna, só os tokens em `app/globals.css` que eles consomem); composições próprias (ex: `components/app-sidebar.tsx`) ficam direto em `components/`.

A inicialização usou a flag `--pointer`: todo `<button>`/`[role=button]` habilitado já recebe `cursor: pointer` globalmente (e cursor padrão quando desabilitado) — não adicionar `cursor-pointer` manualmente.

## Tokens

Nomes semânticos do shadcn, remapeados em `app/globals.css` pros hex exatos do Akopil (não os cinzas genéricos do preset):

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
| `--radius` | `0.375rem` (`6px`) | — | Radius único |

Não existe ainda token equivalente a `gray-3` (`#a3a3a3`, texto terciário/riscado) — ao precisar (ex: preço riscado na Fase 3), adicionar em `:root`, não usar cor solta.

## Radius

`6px` (via `--radius`) em toda superfície com borda — fotos, botões, pills, badges, drawer. Nunca `border-radius: 50%`/pill totalmente redondo, nunca `0` totalmente quadrado. Isso já foi decidido e revertido uma vez (pills e badge começaram em `100px` e foram unificados) — não reabrir essa decisão sem o usuário pedir explicitamente.

Garantido tecnicamente: a escala de radius do Tailwind (`--radius-sm` a `--radius-4xl`) foi achatada em `app/globals.css` pra todas resolverem em `var(--radius)` — nenhuma classe (`rounded-md`, `rounded-xl`, etc.) usada por um componente shadcn foge do `6px`.

## Tipografia

Uma família só: Inter (grotesco). Hierarquia por peso, não por família:
- `900` — logo
- `700` — títulos, texto de botão (CTA)
- `500` / `400` — corpo, labels, texto secundário

## Componentes reutilizados entre páginas

Nomes como ".btn-solid"/".pill" descrevem a intenção visual do mockup — implementar com o componente shadcn equivalente (`Button variant="default"`/`"outline"`, `Badge`), nunca como classe CSS customizada.

- Header — idêntico em home e produto (logo `AKOPIL`, nav Catálogo/Sobre, ícone de carrinho com contador que abre o drawer)
- Footer — idêntico em home e produto (logo, atalho WhatsApp, copyright)
- Botão sólido/outline — usados na página de produto e no drawer do carrinho
- Pill (material/tag) — usado nos filtros da home e nas tags da página de produto
- Drawer do carrinho — global, acionável de qualquer página, não é uma rota própria (avaliar `Sheet` do shadcn, já instalado, em vez de construir do zero)

## Layout — Home

Ordem vertical: Header → carrossel "Mais vendidos" (scroll horizontal, sem paginação, filtra `best_seller = true`) → Grid de produtos (imagem, nome, tags, preço; 4 colunas desktop / 2 mobile, infinite scroll em lotes de ~16) → Footer. Filtros (pills "Todos" + material/tag) fazem parte do design original mas **não foram implementados** — removidos do escopo da Fase 2 por decisão do usuário (`docs/sessions.md`); não assumir que existem.

## Layout — Produto

Duas colunas (empilha no mobile): grid 2×2 de fotos à esquerda; à direita eyebrow, nome, preço (+ riscado e badge "Promoção" quando há `original_price`), campo Material, campo Tags (pills), descrição curta, e dois botões lado a lado (`Adicionar ao carrinho` outline / `Abrir agora` sólido).

## Layout — Drawer do carrinho

Painel deslizante da direita, não é página. Cabeçalho "Sacola" com fechar, lista de itens (miniatura, nome, preço, remover), subtotal, dois botões (`Continuar comprando` outline / `Finalizar compra` sólido).

Use o mockup navegável como referência pixel-a-pixel de espaçamento, breakpoints (`860px`) e estrutura de markup antes de divergir por conta própria.
