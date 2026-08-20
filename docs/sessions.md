# Akopil — Sessões

Documento vivo. Objetivo: qualquer sessão nova (sua ou do Claude Code) consegue retomar o projeto sem re-perguntar o que já foi decidido ou refazer o que já existe. Atualizar isto a cada sessão de trabalho — no mínimo, marcar fases concluídas e registrar decisões novas no log.

Regra de uso: antes de começar a trabalhar, ler a seção "Estado atual" e as últimas 2-3 entradas do log. Antes de encerrar uma sessão, atualizar as duas.

## Estado atual

**Fase ativa:** nenhuma implementação de código começou ainda. Projeto está 100% na etapa de documentação/planejamento.

**Concluído:**
- Documentação de arquitetura, stack, data model, design system, convenções e referências em [`docs/`](.).
- Skills operacionais em [`.claude/skills/`](../.claude/skills/) (design-system, i18n-content, notion-sync, code-conventions).
- Decisões fechadas nesta fase: env var `NEXT_PUBLIC_WHATSAPP_NUMBER` criada (valor ainda não fornecido), filtros de material/tag sempre dinâmicos via query (nunca lista fixa), domínio de produção `akopil.com.br`.

**Pendente antes de codar:**
- Valor de `NEXT_PUBLIC_WHATSAPP_NUMBER` (número real, formato internacional).

## Roadmap de fases

Ordem sugerida no kickoff original — cada fase só deve começar quando a anterior estiver funcional, não só "escrita".

- [ ] **Fase 1 — Fundação de dados**
  Schema (já existe no Supabase) + rota de sync (Notion → Supabase, full resync) + painel `/admin` com login (Supabase Auth) e botão de sincronizar.
  Referência: [architecture.md](architecture.md), [data-model.md](data-model.md), [notion-sync (skill)](../.claude/skills/notion-sync/SKILL.md).

- [ ] **Fase 2 — Home**
  Header, carrossel de mais vendidos (`best_seller = true`), filtros dinâmicos, grid paginado (infinite scroll em lotes de ~16), footer.
  Referência: [design-system.md](design-system.md).

- [ ] **Fase 3 — Produto**
  Grid 2×2 de fotos, informações, dois botões (Adicionar ao carrinho / Abrir agora), drawer do carrinho (Continuar comprando / Finalizar compra).
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
