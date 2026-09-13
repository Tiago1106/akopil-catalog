# Changelog

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/). Versionamento segue [SemVer](https://semver.org/lang/pt-BR/).

Este arquivo registra o que mudou em cada versão. Contexto e decisões de arquitetura/produto ficam em [`documentation.md`](documentation.md).

## [Unreleased]

## [1.1.0] — 2026-09-13

### Adicionado

- Banner de imagens de promoções: admin `/admin/banners` (upload multi-arquivo, nome editável, drag-and-drop desktop-only, ativo/inativo, link opcional, versão desktop separada da mobile), carrossel autoplay na Home.
- Cadastro de produto nativo em `/admin/products` (criar/editar página cheia, até 4 fotos, tags/material texto livre, paginação, duplicar produto), com controle de quantidade em estoque (badge "Esgotado" sobre a foto, "Última unidade!" inline ao lado do preço, teto no carrinho, revalidação de estoque no checkout).
- Importação em lote de produtos via CSV+ZIP exportado do Notion (parse no navegador, prévia antes de confirmar, duplicata por nome pulada) — caminho de migração único, não integração contínua.
- Atalho "Ver catálogo" na sidebar do admin.
- Ambiente de dev separado (segundo projeto Supabase) pra testar mudanças de admin sem afetar dados reais de produção.

### Removido

- Integração com Notion por completo (sync, botão "Sincronizar", dependência `@notionhq/client`) — cadastro de produto deixou de depender de CMS externo.

### Alterado

- Dashboard do admin (`/admin`) trocou "última sincronização" por contagem de produtos sem estoque.
- Campo de preço `original_price` renomeado para `discount_price`: `price` agora é sempre o valor real/cheio do produto (riscado quando há promoção), `discount_price` é o valor efetivamente cobrado quando há desconto.

## [1.0.0] — 2026-09-03

Primeira versão em produção. Reúne as Fases 1 a 4 do roadmap original.

### Adicionado

- Sincronização de produtos Notion → Supabase (full resync via botão em `/admin`), com upload de imagens pro Supabase Storage.
- Painel `/admin` com login (Supabase Auth), dashboard (última sincronização, produtos ativos) e botão de sincronizar.
- Home pública: header fixo, carrossel "Mais vendidos", grid de produtos com infinite scroll (lotes de 16), footer.
- Página de produto: galeria de fotos (grid 2×2 no desktop, carrossel no mobile, lightbox em tela cheia), preço com suporte a promoção (preço riscado + badge), material, tags, descrição.
- Carrinho (sacola): estado global via Zustand, persistido em `localStorage`, agrupado por produto com controle de quantidade, drawer acessível pelo ícone do header.
- Finalização de compra: mensagem de WhatsApp montada a partir dos itens da sacola (com regra de total/total com desconto) e link `wa.me` real.
- UI reconstruída em shadcn/ui (base Radix, preset Nova) com design tokens monocromáticos e radius único (`6px`).
