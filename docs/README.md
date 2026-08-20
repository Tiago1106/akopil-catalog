# Akopil — Documentação do projeto

Catálogo de óculos de sol (duas páginas: home + produto), sem checkout de pagamento — finalização é um redirect para o WhatsApp com mensagem pronta.

## Índice

- [sessions.md](sessions.md) — **ler primeiro em toda sessão nova.** Estado atual, roadmap de fases, log de decisões.
- [architecture.md](architecture.md) — visão geral, por que Notion + Supabase são separados, fluxo de dados em runtime e no sync, deploy.
- [stack.md](stack.md) — tecnologias escolhidas, variáveis de ambiente, por que cada decisão foi tomada.
- [data-model.md](data-model.md) — schema da tabela `products`, estrutura do Storage, consultas típicas do site público.
- [design-system.md](design-system.md) — tokens, radius, tipografia, estrutura das páginas e do drawer do carrinho.
- [conventions.md](conventions.md) — idioma do código, regras de i18n, segurança de variáveis de ambiente, estrutura de pastas sugerida.
- [references.md](references.md) — serviços externos, documentos-fonte, pendências que dependem de informação do usuário.

## Documentos-fonte (mockup e specs originais)

- [akopil-database.md](akopil-database.md)
- [akopil-layout.md](akopil-layout.md)
- [akopil-layout-mockup.html](akopil-layout-mockup.html)

## Skills do projeto

Os arquivos acima têm uma contraparte operacional em `.claude/skills/`, carregada automaticamente pelo Claude Code ao gerar ou revisar código — mesma fonte de verdade, formato voltado para orientar geração de arquivo em vez de leitura humana:

- [design-system](../.claude/skills/design-system/SKILL.md)
- [i18n-content](../.claude/skills/i18n-content/SKILL.md)
- [notion-sync](../.claude/skills/notion-sync/SKILL.md)
- [code-conventions](../.claude/skills/code-conventions/SKILL.md)

## Regra geral

Nenhuma decisão nova (visual, de schema, de convenção) deve ser inventada durante a implementação sem antes checar se já está coberta aqui ou nos documentos-fonte. Se não estiver coberta, perguntar antes de assumir.
