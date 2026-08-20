---
name: i18n-content
description: Regras de conteúdo e i18n do Akopil — nenhuma string em pt-BR hardcoded em componente, formato da mensagem do WhatsApp. Ler antes de escrever texto visível ao usuário em qualquer componente.
---

# Conteúdo e i18n — Akopil

## Regra inegociável

Nenhuma string em português é escrita direto num componente. Todo texto visível ao usuário (labels, botões, mensagens, placeholders, textos de erro) vive em `pt-BR.json` e é referenciado por chave. Código (variáveis, funções, componentes, arquivos) é sempre em inglês — só o conteúdo do JSON de tradução é em português.

Isso vale mesmo para textos aparentemente triviais ("Adicionar ao carrinho", "Sacola", "Remover") — todos entram no `pt-BR.json`.

## Formatação de preço

Sempre via `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })` — nunca concatenação manual de string. Resultado esperado: `R$ 1.234,56`.

## Mensagem do WhatsApp (finalizar compra)

Fonte de verdade: [`docs/akopil-layout.md`](../../../docs/akopil-layout.md) (seção 6).

Decisão fechada: **sempre todos os itens do carrinho numa mensagem só** — não existe finalizar por item individual.

Sintaxe é a do próprio WhatsApp, não markdown comum:
- `*texto*` → negrito
- `~texto~` → riscado

Estrutura da mensagem (labels vêm do `pt-BR.json`):

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

Regras de cálculo:
- **Valor total** = soma dos `price` (preço original) de cada item.
- **Valor com desconto** = soma dos preços reais pagos (usa `original_price` quando existe, senão `price`).
- Se **nenhum** item do carrinho tiver `original_price`, mostra só uma linha `Valor: R$ X,XX` — nunca duplicar total/desconto quando não há diferença.
- Link final: `https://wa.me/{numero}?text={mensagem}`, com a mensagem inteira (quebras de linha incluídas) passada por `encodeURIComponent`. `{numero}` vem de `process.env.NEXT_PUBLIC_WHATSAPP_NUMBER`, nunca hardcoded no componente.

Não inventar variação no formato (emojis, texto extra, reordenar seções) sem o usuário pedir — o formato acima é decisão fechada.
