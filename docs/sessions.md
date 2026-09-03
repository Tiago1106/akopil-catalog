# Akopil — Sessões

Documento vivo. Objetivo: qualquer sessão nova (sua ou do Claude Code) consegue retomar o projeto sem re-perguntar o que já foi decidido ou refazer o que já existe. Atualizar isto a cada sessão de trabalho — no mínimo, marcar fases concluídas e registrar decisões novas no log.

Regra de uso: antes de começar a trabalhar, ler a seção "Estado atual" e as últimas 2-3 entradas do log. Antes de encerrar uma sessão, atualizar as duas.

## Estado atual

**Fase ativa:** Fases 1, 2 e 3 completas. Próxima fase a começar: Fase 4 (Finalização/WhatsApp) — depende do valor real de `NEXT_PUBLIC_WHATSAPP_NUMBER`, ainda não fornecido.

**Concluído:**
- Documentação de arquitetura, stack, data model, design system, convenções e referências em [`docs/`](.).
- Skills operacionais em [`.claude/skills/`](../.claude/skills/) (design-system, i18n-content, notion-sync, code-conventions).
- Decisões fechadas na etapa de documentação: env var `NEXT_PUBLIC_WHATSAPP_NUMBER` criada (valor ainda não fornecido), filtros de material/tag sempre dinâmicos via query (nunca lista fixa), domínio de produção `akopil.com.br`.
- Projeto Next.js (App Router, TypeScript, Tailwind v4, npm) inicializado, conectado e publicado no repositório GitHub `Tiago1106/akopil-catalog` (branch `main`).
- Fase 1 completa: rota de sync (`app/api/sync/route.ts` + `lib/sync/`, `lib/notion/`), painel `/admin` com login/logout via Supabase Auth, proteção via `proxy.ts` (Next 16 renomeou `middleware.ts` → `proxy.ts`). Ver entradas de log abaixo para detalhes de verificação.
- **shadcn/ui adotado como biblioteca de componentes do projeto** (base Radix, preset Nova) — tokens remapeados pro design system monocromático, radius achatado em `6px` único. Painel `/admin` reconstruído em cima disso: sidebar de verdade com ícones, dashboard com 2 cards (`Card`), login com `Field`/`Input`/`Button`, toasts (`sonner`) pro feedback do sync. Ver [design-system.md](design-system.md) e [design-system (skill)](../.claude/skills/design-system/SKILL.md) atualizados.
- **Fase 2 completa**: Home pública (`app/(site)/`) com header, carrossel "Mais vendidos", grid paginado com infinite scroll (lotes de 16), tags nos cards, footer. Filtros foram removidos por decisão do usuário (ver log) — não fazem parte do escopo atual. Ver entrada de log abaixo para detalhes.
- **Fase 3 completa**: página de produto (`/produto/[slug]`), carrinho global via Zustand (`store/cart.ts`, agrupado por produto com quantidade, persistido em `localStorage`), drawer da sacola (`components/cart-drawer.tsx`, `Sheet` do shadcn), ícone de carrinho do header (fixo/sticky) funcional, único botão "Adicionar ao carrinho" (adiciona + abre o drawer), fotos com fallback correto (só mostra o que existe), carrossel de uma foto no mobile, lightbox em tela cheia no desktop. "Finalizar compra" fica `disabled` propositalmente — a lógica de verdade é Fase 4. Ver entrada de log abaixo para detalhes.
- `git push` feito até a Fase 3 — histórico completo (Fase 1, rebuild em shadcn, Fase 2, Fase 3) está em `origin/main`.

**Pendente:**
- Valor de `NEXT_PUBLIC_WHATSAPP_NUMBER` (número real, formato internacional) — necessário só na Fase 4.
- Criar o usuário do Supabase Auth (Dashboard → Authentication → Users) e testar o login em `/admin/login` manualmente — não foi feito pelo Claude Code por não criar contas/senhas em nome do usuário.
- Confirmar visualmente (usuário, fora do ambiente automatizado) que o infinite scroll da Home carrega mais produtos ao rolar de verdade — o endpoint (`/api/products`) foi validado via `curl` e a lógica revisada, mas o `IntersectionObserver` não disparou no navegador automatizado desta sessão (mesma limitação já vista com `loading="lazy"` em imagens).

## Roadmap de fases

Ordem sugerida no kickoff original — cada fase só deve começar quando a anterior estiver funcional, não só "escrita".

- [x] **Fase 1 — Fundação de dados**
  Schema (já existe no Supabase) + rota de sync (Notion → Supabase, full resync) + painel `/admin` com login (Supabase Auth) e botão de sincronizar.
  Referência: [architecture.md](architecture.md), [data-model.md](data-model.md), [notion-sync (skill)](../.claude/skills/notion-sync/SKILL.md).

- [x] **Fase 2 — Home**
  Header, carrossel de mais vendidos (`best_seller = true`), grid paginado (infinite scroll em lotes de ~16), tags nos cards, footer. Filtros dinâmicos **não foram implementados** — removidos do escopo por decisão do usuário (ver log).
  Referência: [design-system.md](design-system.md).

- [x] **Fase 3 — Produto**
  Grid 2×2 de fotos, informações, dois botões (Adicionar ao carrinho / Abrir agora), drawer do carrinho (Continuar comprando / Finalizar compra — este último `disabled` até a Fase 4).
  Referência: [design-system.md](design-system.md).

- [ ] **Fase 4 — Finalização**
  Monta mensagem do WhatsApp (formato fechado) e abre `wa.me`.
  Referência: [i18n-content (skill)](../.claude/skills/i18n-content/SKILL.md).

Cada fase, ao concluir, deve ser marcada `[x]` aqui e ganhar uma entrada correspondente no log abaixo.

## Log de sessões

### 2026-08-20 — Kickoff e documentação

- Recebido o briefing inicial (arquitetura, stack, data model, design system, mockup navegável).
- Lidos os três documentos-fonte ([akopil-database.md](akopil-database.md), [akopil-layout.md](akopil-layout.md), [akopil-layout-mockup.html](akopil-layout-mockup.html)).
- Detectado que `.claude/skills/` não existia (o briefing assumia que já existiam) — perguntado ao usuário, decidido criar a partir dos documentos-fonte.
- Criadas as 4 skills e os 6 documentos de `docs/` (architecture, stack, data-model, design-system, conventions, references) + índice em [README.md](README.md).
- Decisões tomadas pelo usuário e propagadas para a documentação:
  - Número de WhatsApp vira env var `NEXT_PUBLIC_WHATSAPP_NUMBER` (pública, montada no client) — valor ainda não informado.
  - Lista de materiais/tags dos filtros nunca é fixa no código — sempre `select distinct` contra `products`, refletindo o que vem do Notion/Supabase.
  - Domínio de produção definido: `akopil.com.br`.
- Criado este documento de sessões, a pedido do usuário, para não perder contexto entre sessões antes de começar a implementação.
- **Nenhum código de aplicação foi escrito ainda.** Próximo passo é a Fase 1 (schema/sync/admin).

### 2026-08-20 — Fase 1: sync, admin e verificação end-to-end

- Planejado em plan mode: inspecionado o Notion real via MCP pra confirmar nomes exatos das propriedades (`Name`, `Description`, `Price`, `Original Price`, `Material`, `Tags`, `Images`, `Best Seller`, `Ativo`) e confirmado que o repositório GitHub `Tiago1106/akopil-catalog` já existia, vazio. Decisões confirmadas com o usuário: TypeScript, npm, Tailwind (pedido explícito do usuário, mudando o plano inicial de CSS puro), conectar ao GitHub existente sem push.
- Bootstrap: `create-next-app` (Next.js 16.3.1, App Router, TypeScript, Tailwind v4). **Descoberta importante**: nessa versão do Next.js, Middleware foi renomeado para **Proxy** — o arquivo é `proxy.ts` na raiz (não `middleware.ts`), função exportada como `proxy`. Só foi descoberto lendo `node_modules/next/dist/docs/` (o `AGENTS.md` gerado pelo próprio `next dev` avisa que a versão pode ter mudanças que não estão no conhecimento do modelo) — vale sempre checar essa pasta antes de assumir convenção do Next em versões novas.
- Implementado: `lib/notion/` (client + mapeamento de propriedades), `lib/sync/` (slug com desambiguação estável por `notion_page_id`, upload de imagem isolado por falha, orquestração do sync com sweep de inativos), `lib/supabase/` (client server via `@supabase/ssr`, client admin via chave secreta, ambos com `"server-only"`), `app/api/sync/route.ts`, `proxy.ts`, painel `/admin` (login via Server Action + `useActionState`, dashboard protegido por route group `(protected)`, botão de sincronizar).
- Tailwind configurado em `app/globals.css` com `@theme` resetando `--color-*` e `--radius-*` do Tailwind e redefinindo só os tokens do design system (`--color-black`, `--gray-1..4`, `--radius-akopil: 6px`) — evita que `rounded-full`/`blue-500` etc. apareçam por engano em fases futuras.
- Build, typecheck e lint limpos.
- **Verificação end-to-end contra o Notion/Supabase reais** (com aprovação explícita do usuário antes de cada escrita em produção, via uma rota de teste temporária sem auth que só existiu localmente e nunca foi commitada):
  - Encontrado e corrigido: `service_role`/`anon`/`authenticated` não tinham `GRANT` na tabela `products` (`permission denied for table products`, código Postgres `42501`) — não era problema de RLS como eu tinha registrado antes no plano, e sim GRANT de tabela ausente. O usuário rodou o fix no SQL Editor do Supabase (`grant select, insert, update on public.products to service_role; grant select on public.products to anon, authenticated;` — sem `delete` pra ninguém).
  - Sync rodado contra o produto de teste real do Notion ("Oculos teste"): upsert correto, slug gerado certo, 3 imagens baixadas do Notion e re-hospedadas no Storage com URL pública funcionando (confirmado via `curl`).
  - Idempotência confirmada: rodar de novo sem mudar nada mantém o mesmo `id`/`created_at`, só avança `synced_at`.
  - Desmarcar `Ativo` no Notion → sync → `active = false` no Supabase, linha não deletada. Revertido depois pra deixar o produto de teste como estava.
  - Não testado via deleção real de página no Notion (evitado por ser destrutivo no workspace do usuário) — o mecanismo de sweep (`missingIds`) é o mesmo update simples usado no teste de `Ativo`, então foi considerado coberto por revisão de código.
  - Corrigido durante a verificação: `proxy.ts` estava redirecionando `POST /api/sync` sem sessão pra uma página HTML (307) em vez de deixar a rota devolver `401` JSON — quebraria qualquer chamador não-browser. Ajustado pra `proxy.ts` só redirecionar rotas de página `/admin/*`, e a API mantém seu próprio check de auth.
- **Não feito** (fora do escopo de código, decisão consciente): criar o usuário do Supabase Auth — pedido ao usuário fazer manualmente no dashboard, já que criar contas/senhas em nome do usuário é uma ação vedada. Login real em `/admin/login` com credencial de verdade ainda não foi testado.

### 2026-08-20 — Rebuild do painel admin em shadcn/ui

- Pedido do usuário: layout "de verdade" pro admin (sidebar com ícones), dashboard em `/admin` com 2 cards simples (última sincronização, quantidade de produtos), e **sempre usar componentes shadcn/ui** daqui pra frente — se um componente não existir na lib, confirmar antes de fazer algo customizado.
- `npx shadcn@latest init` (base Radix, preset Nova, flag `--pointer` pra cursor pointer nativo em todo botão). Todos os componentes pedidos existiam no registry (`button`, `card`, `field`, `input`, `sidebar`, `separator` + dependências como `sheet`/`tooltip`/`skeleton`/`label`) — nenhuma confirmação extra foi necessária.
- Reconciliado o preset (cores cinza genéricas em oklch, radius em escala) com o design system: `--background`/`--foreground`/`--primary`/`--border`/etc. remapeados pros hex exatos do Akopil, e toda a escala de radius (`sm` a `4xl`) achatada pra sempre resolver em `6px` — nenhum componente shadcn consegue fugir do radius único, não importa qual classe use.
- Criado `components/app-sidebar.tsx`: sidebar colapsável, cabeçalho "AKOPIL", nav "Dashboard" (ícone `LayoutDashboard`, lucide-react), rodapé com "Sair" — estrutura pronta pra crescer com mais itens depois.
- Dashboard (`/admin`) reescrita com 2 `Card`: última sincronização e produtos ativos. Quando não há valor (nunca sincronizou, contagem indisponível), mostra `-` em vez de frase — padrão pedido pelo usuário pra qualquer estado vazio.
- Login reescrito no padrão exato de `Card`/`Field`/`FieldGroup`/`FieldLabel`/`Input`/`Button` que o usuário passou, em português, mantendo a mesma Server Action + `useActionState` de antes; erro de credencial via `FieldError`; botão com spinner (`Loader2` do lucide) enquanto a Server Action roda.
- Botão de sincronizar migrado pro `Button` do shadcn, com spinner durante o request e toast neutro ("Sincronização iniciada...") disparado no clique, além dos toasts de sucesso/erro já existentes — pedido do usuário: toasts de resultado com cor de verdade (verde/vermelho, via `richColors` do sonner, não monocromático) posicionados no topo centralizado, 3 segundos.
- **Bug encontrado e corrigido**: o `shadcn init` gerou uma linha circular em `globals.css` (`--font-sans: var(--font-sans)` dentro de `@theme inline`), o que invalida a custom property no CSS e faz o navegador cair no serif padrão — resultado: a fonte Inter parava de ser aplicada silenciosamente. Removida a linha duplicada; confirmado via `getComputedStyle` no navegador que `font-family` volta a resolver pra Inter.
- Verificação: sidebar, cards, ícones, cores e radius computados checados numa página de teste isolada (nunca commitada); o botão de sincronizar de verdade testado com clique real (não só inspeção visual) — dispara `/api/sync`, mostra spinner, trata sucesso/erro via toast, reseta estado. Typecheck, lint e build limpos em cada passo.
- Usuário validou e pediu commit + push — feito. Nada ficou pendente de aprovação.
- **Próximo passo de convenção**: qualquer componente novo de UI (home/produto/carrinho nas próximas fases) deve ser construído com shadcn (`npx shadcn@latest add <nome>`) em vez de CSS/classes customizadas à mão, seguindo o mesmo remapeamento de tokens já feito aqui.

### 2026-08-28 — Fase 2: Home pública

- Planejado em plan mode (Explore/Plan agent): route group `app/(site)/` isolando Header/Footer do site público do layout do `/admin`; camada de dados em `lib/products/` reusando `lib/supabase/server.ts`; infinite scroll via Route Handler (`app/api/products/route.ts`), não Server Action, por ser leitura pura/GET; breakpoint custom `860px` (`--breakpoint-catalog`) porque o mockup não bate com `md`/`lg` do Tailwind; token `--gray-3` adicionado (preço riscado, usado já na Home, corrigindo nota dos docs que dizia "só Fase 3").
- Implementado: `components/site-header.tsx`, `components/site-footer.tsx` (link do WhatsApp omitido quando `NEXT_PUBLIC_WHATSAPP_NUMBER` não está setada — nunca `wa.me/undefined`), `app/(site)/page.tsx` (Server Component, `Carousel` do shadcn pro "Mais vendidos"), `app/(site)/product-card.tsx`, `app/(site)/product-grid.tsx` (Client Component, `IntersectionObserver` + fetch pro `/api/products`).
- **Filtros implementados e depois removidos**: o plano original incluía filtros multi-select (material/tag/promoção, combinação OR dentro da categoria + AND entre categorias — decisão do usuário antes do plano) com pills via `Badge`, opções dinâmicas via `select distinct`. Implementado, funcionando, e depois o usuário pediu pra remover tudo ("não vamos ter os filtros por agora") — revertido: `filter-pills.tsx` e `lib/products/filters.ts` apagados, `getFilteredProducts`/`getFilterOptions` simplificados pra um único `getProducts()` sem filtro, `Badge` removido (e depois reinstalado pras tags do card). A intenção de filtro dinâmico continua documentada em `data-model.md`/`design-system.md` como desenho futuro, não foi descartada — só adiada.
- **Bug de dado encontrado durante a verificação end-to-end** (não é bug de código): a leitura pública (`anon`) retornava **zero produtos sem erro nenhum**, enquanto o client admin (service role) via a linha normalmente — assinatura clássica de RLS habilitado sem nenhuma policy (diferente do problema de `GRANT` ausente da Fase 1, que dava erro explícito `42501`). Corrigido pelo usuário no SQL Editor: `create policy "Public read access to active products" on public.products for select to anon, authenticated using (active = true);` — na prática uma melhoria sobre o estado anterior (sem RLS nenhum), já que agora a leitura pública só enxerga `active = true` garantido pelo próprio banco.
- **Erro de imagem investigado**: `dangerouslyAllowSVG is disabled` no `next/image` — rastreado até um objeto antigo no Storage servido com `Content-Type: image/svg+xml` antes do fix de RLS. Depois de limpar `.next/cache/images` e confirmar via `curl -I` que o Storage já servia `image/jpeg` corretamente, o erro não voltou a ocorrer.
- Populado o catálogo real de teste a pedido do usuário: 24 produtos criados no Notion via MCP (mais o "Oculos teste" que já existia = 25), incluindo adicionar as opções que faltavam nos selects do Notion (`Material`: Metal, Titânio; `Tags`: Feminino, Unissex, Polarizado — só existiam Acetato/Oferta/Masculino) via `ALTER COLUMN ... SET SELECT(...)`/`MULTI_SELECT(...)`, e sincronizado (25 upsertados, 0 erro).
- Verificado com dado real: carrossel de mais vendidos com a contagem certa, grid paginando exatamente 16 por página, preço riscado em promoção, fallback "Sem foto" nos produtos sem imagem. Paginação (`offset=16` devolvendo os 9 restantes, `hasMore:false` no fim) confirmada via `curl` direto no endpoint — o disparo automático do `IntersectionObserver` ao rolar não foi possível confirmar no navegador automatizado (mesma limitação de lazy-loading já registrada na Fase 1/rebuild admin), fica pendente de confirmação visual do usuário.
- Ajuste de design a pedido do usuário: cards do carrossel aumentados de `200px` (valor do mockup original) pra `300px` — no layout de 4 colunas real, 200px ficava menor que os cards do grid, o oposto de "destaque" pra uma seção de mais vendidos.
- **Ideia de CTA "adicionar ao carrinho" direto no card (inspirada no hover da Nike) discutida e descartada**: hover não existe em touch, e como mobile é a prioridade do produto (não desktop), o usuário decidiu não ter esse botão no card em nenhum dispositivo por enquanto — usuário entra no produto pra adicionar. Fica registrado como uma ideia considerada e rejeitada, não reabrir sem o usuário pedir de novo.
- Da mesma ideia, só a parte de mostrar as **tags no card** (nome + tags + preço) foi mantida e implementada — `Badge` reinstalado, tags renderizadas entre nome e preço, testado em mobile (2 colunas) e desktop sem estourar o card.
- Typecheck, lint e build limpos em cada passo. Usuário validou e pediu pra fechar a fase + commit.

### 2026-09-03 — Fase 3: página de produto, carrinho (Zustand) e drawer

- Planejado em plan mode (Plan agent): store de carrinho, `getProductBySlug`, página de produto, drawer, wiring do header. Duas decisões de negócio fechadas com o usuário antes do plano: **carrinho agrupa por produto com quantidade** (clicar "Adicionar" duas vezes incrementa uma linha, não duplica — diferente do mockup, que não tinha stepper; precisou desenhar esse controle do zero) e **"Finalizar compra" fica inerte** nesta fase (sem montar mensagem/abrir `wa.me` — isso é Fase 4, que também depende do número do WhatsApp ainda não configurado).
- `npm install zustand`. Store em `store/cart.ts`: `items` (agrupados por `productId` com `quantity`), `isOpen`/`openCart`/`closeCart`, persistido em `localStorage` via `zustand/middleware persist` (só `items`, não `isOpen` — o drawer sempre começa fechado num load novo). Decrementar a quantidade até 0 remove a linha automaticamente (evita ter dois controles diferentes — stepper e "Remover" — pra sair do carrinho).
- `getProductBySlug(slug)` em `lib/products/queries.ts`, mesmo padrão de `getProducts`/`getBestSellers`; usa `.maybeSingle()` e filtra `active = true`, cobrindo slug inexistente e produto desativado no mesmo caminho — página resolve com `notFound()` do Next.
- Página de produto (`app/(site)/produto/[slug]/page.tsx`): grid 2×2 de fotos com o mesmo padrão de fallback "Sem foto" do card da Home, preço com riscado + badge "Promoção", campos Material/Tags/Descrição condicionais (só renderizam se o dado existir), dois botões (`product-actions.tsx`, Client Component) — "Adicionar ao carrinho" (outline) e "Abrir agora" (sólido, adiciona + abre o drawer).
- **Bug estrutural encontrado e corrigido durante a verificação**: a página foi criada inicialmente em `app/produto/[slug]/`, fora do route group `app/(site)/` — como route groups só aplicam o layout às rotas aninhadas dentro da pasta, a página ficava sem header/footer/drawer (só o layout raiz). Corrigido movendo pra `app/(site)/produto/[slug]/` (URL não muda, `(site)` não entra no path). Vale lembrar disso ao criar qualquer rota nova do site público.
- Drawer (`components/cart-drawer.tsx`): `Sheet` do shadcn controlado pelo estado do store, `SheetDescription` com `sr-only` só pra acessibilidade do Radix Dialog. Lista de itens com miniatura, preço de linha (unitário × quantidade), stepper +/- (`Minus`/`Plus` do lucide), "Remover" removendo a linha inteira. Subtotal somando todas as linhas. "Finalizar compra" fica `disabled` (não só inerte-mas-clicável) — um CTA sólido que não reage a clique pareceria bug; desabilitado comunica "ainda não disponível" com clareza.
- Header (`components/site-header.tsx`) virou Client Component: ícone de carrinho agora abre o drawer, com contador circular (`rounded-full`) mostrando a soma das quantidades — **segunda exceção documentada ao radius único** (a primeira é a cor dos toasts), registrada em `design-system.md`: um indicador numérico pequeno não é uma "superfície" no sentido da regra.
- Verificado com interação real no navegador (clique via JS direto no elemento — a mesma limitação de clique simulado por coordenada já vista antes voltou a acontecer, contornada do mesmo jeito): adicionar duas vezes agrupa em `quantity: 2`; decrementar até 0 remove a linha; "Remover" tira a linha inteira; subtotal recalcula certo; contador do header reflete a soma e some com o carrinho vazio; "Abrir agora" adiciona e abre o drawer na mesma ação; "Continuar comprando" fecha; carrinho persiste em `localStorage` entre navegações; slug inexistente devolve 404 real do Next; layout empilha em coluna única abaixo de `860px` (breakpoint `catalog`).
- Typecheck, lint e build limpos em cada passo.

**Refinamentos pedidos pelo usuário depois da primeira verificação (mesmo dia, antes de fechar a fase):**
- **Um botão só**: "Abrir agora" e "Adicionar ao carrinho" faziam quase a mesma coisa — removido "Abrir agora", ficou só "Adicionar ao carrinho" (`product-actions.tsx`), que já adiciona ao carrinho e abre o drawer na mesma ação.
- **Header fixo** (`sticky top-0 z-40 bg-background`) — o ícone do carrinho fica sempre acessível ao rolar a página.
- **Fallback de foto corrigido**: a grade 2×2 preenchia os slots vazios com "Sem foto" mesmo quando o produto tinha 1-3 fotos reais. Agora mostra só as fotos que existem de verdade (sem preencher slot vazio), e o fallback "Sem foto" único só aparece quando o produto não tem **nenhuma** foto.
- **Carrossel de fotos no mobile** (`product-photos.tsx`, novo): a grade 2×2 ficava pequena demais no mobile — trocada por um carrossel de uma foto por vez em largura cheia (sem espiar a próxima, `CarouselItem` no `basis-full` padrão), com bolinhas de posição sincronizadas via `CarouselApi`. Desktop continua com a grade 2×2.
- **Lightbox em tela cheia no desktop**: clicar numa foto da grade abre um `Dialog` em tela cheia com um carrossel novo, começando exatamente na foto clicada (`opts={{ startIndex }}` + `key={lightboxIndex}` forçando remount do embla a cada clique), com setas de navegação (`CarouselPrevious`/`CarouselNext`, radius `6px` sobrescrevendo o `rounded-full` padrão do componente, pra não abrir uma terceira exceção ao radius único sem necessidade).
- **Dois bugs do componente `Dialog` do shadcn encontrados e corrigidos** (primeiro uso do Dialog no projeto — só tínhamos usado `Sheet` até aqui): (1) a animação `data-open:zoom-in-95` ficava travada em 95% de escala em vez de completar pra 100% — removida a classe de zoom, ficou só fade; (2) o carrossel dentro do modal colapsava com largura/altura zero porque o `Carousel` raiz tinha `flex items-center`, o que quebra o jeito como `CarouselContent` (que só recebe `className` no `div` interno, não no wrapper `overflow-hidden` que faz a medição do embla) calcula altura — corrigido usando `h-dvh` explícito (unidade absoluta, não depende de porcentagem de um ancestral com altura definida) em vez de `h-full`.
- Typecheck, lint e build limpos em cada passo. Usuário validou e pediu pra fechar a fase + commit.
