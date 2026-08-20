# Akopil — Layout (fechado)

Referência do layout final das duas páginas do site + drawer de carrinho, pra guiar a implementação no Claude Code. Arquivo de mockup navegável: `akopil-layout-mockup.html`.

## 1. Design tokens

| Token | Valor | Uso |
|---|---|---|
| `--black` | `#111111` | Texto, botões sólidos, bordas de destaque |
| `--white` | `#ffffff` | Fundo geral |
| `--gray-1` | `#f5f5f5` | Fundo de placeholders de imagem |
| `--gray-2` | `#e5e5e5` | Bordas neutras, divisores |
| `--gray-3` | `#a3a3a3` | Texto terciário (preço riscado, placeholders) |
| `--gray-4` | `#525252` | Texto secundário (labels, preço em cinza) |
| `--radius` | `6px` | Radius único aplicado em **tudo** — fotos, botões, pills, badge, drawer |

Paleta estritamente monocromática — sem cor de destaque em nenhum estado (inclusive promoção, que usa apenas riscado + badge outline).

Tipografia: uma família só (Inter no mockup, grotesco), variando peso pra hierarquia — 900 no logo, 700 em título/CTA, 500/400 no resto.

**Nota de decisão**: o radius começou em `100px` (pill/cápsula) nos filtros e no badge de promoção, e foi unificado pro mesmo `6px` dos outros elementos — não existe mais radius "totalmente redondo" em nenhum componente do site.

## 2. Home

Ordem vertical da página:

1. **Header** — logo `AKOPIL`, nav (Catálogo / Sobre), ícone de carrinho com contador. Clicar no ícone abre o drawer do carrinho.
2. **Mais vendidos** — carrossel horizontal de cards de produto (scroll, sem paginação).
3. **Filtros** — pills por material/tag + "Todos". Pill ativa preenche em preto.
4. **Grid de produtos** — 4 colunas desktop / 2 mobile. Cada card: imagem, nome, preço (com riscado quando há `original_price`). Infinite scroll em lotes de ~16.
5. **Footer** — logo, atalho para WhatsApp, copyright.

## 3. Produto

Layout em duas colunas (empilha no mobile):

- **Esquerda**: grid 2×2 de fotos.
- **Direita**:
  - Eyebrow ("Óculos de sol")
  - Nome
  - Preço (+ preço riscado e badge "Promoção" quando aplicável)
  - Campo Material
  - Campo Tags (pills)
  - Descrição curta
  - **Dois botões lado a lado**:
    - **Adicionar ao carrinho** (outline) — adiciona o item, permanece na página.
    - **Abrir agora** (preto sólido) — adiciona o item e abre o drawer do carrinho na hora.

## 4. Carrinho (drawer)

Não é uma página — é um painel que desliza da direita, acionado pelo ícone do carrinho em qualquer página (home ou produto) ou pelo botão "Abrir agora".

Estrutura:

- Cabeçalho "Sacola" com botão de fechar.
- Lista de itens: miniatura, nome, preço, opção de remover.
- Subtotal.
- **Dois botões**:
  - **Continuar comprando** (outline) — fecha o drawer, volta pro catálogo sem perder o carrinho.
  - **Finalizar compra** (preto sólido) — monta a mensagem formatada com os itens da sacola e abre o link `wa.me`.

## 5. Componentes reutilizados entre páginas

- Header (idêntico em home e produto)
- Footer (idêntico em home e produto)
- `.btn` / `.btn-outline` / `.btn-solid` — usados no produto e no drawer
- `.pill` — usado nos filtros da home e nas tags do produto
- Drawer do carrinho — global, independente da página em que foi aberto

## 6. Mensagem do WhatsApp (finalizar compra)

Decisão fechada: **sempre envia todos os itens do carrinho numa mensagem só** — não existe finalizar por item individual.

Formato da mensagem (sintaxe do próprio WhatsApp: `*texto*` = negrito, `~texto~` = riscado):

```
Olá! Vim pelo site e gostaria de finalizar a compra.

────────────────────

*Item 1:*
Óculos Aviador
R$ 120,00

────────────────────

*Item 2:*
Óculos Redondo
~R$ 150,00~ → R$ 120,00

────────────────────

Valor total: R$ 270,00
Valor com desconto: R$ 240,00
```

Regras:

- **Valor total** = soma dos `price` originais de cada item (sem desconto).
- **Valor com desconto** = soma dos preços reais (o que vai pagar).
- Se nenhum item do carrinho tiver `original_price`, mostra só uma linha `Valor: R$ X,XX` — não duplica quando não há desconto.
- Preço formatado em `pt-BR` (`R$ 1.234,56`), via `Intl.NumberFormat`.
- Link final: `https://wa.me/{numero}?text={mensagem codificada}` (a mensagem inteira, com quebras de linha, vai `encodeURIComponent`'d na query string).
- Todo o texto fixo da mensagem (saudação, labels "Item", "Valor total", "Valor com desconto") entra no `pt-BR.json`, seguindo a convenção de nenhuma string solta no componente.
