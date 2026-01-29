# Server

Bun tRPC → sidecar binary para Tauri. **NUNCA** rodar `bun run dev:server` — assumir que já está rodando.

## Estrutura

```
src/
├── features/{name}/   # kebab-case
│   ├── router.ts      # Procedures + schemas inline
│   ├── service.ts     # Lógica de negócio
│   ├── types.ts       # Types do domínio
│   ├── helpers.ts     # Único lugar para funções soltas
│   └── *.test.ts      # Testes co-localizados
├── db/
│   ├── index.ts       # Kysely + migrations
│   ├── types.ts       # Database types
│   └── migrations/    # Auto-run on startup
├── lib/
│   ├── trpc.ts        # tRPC base
│   ├── safe.ts        # Result type + withErrorHandler
│   └── logger.ts      # JSONL async logger
└── router.ts          # Root router
logs/                   # Gitignored
├── sessions/{id}.jsonl
└── daily/{date}.jsonl
```

## Convenções

### Routers

Schemas inline com `const schemas = { ... } as const`. Deixar tRPC inferir output (nunca output schema).

Sem async desnecessário: `query(({ input }) => repo.find(input.id))` não `async ({ input }) => await repo.find(input.id)`

### Organização

- Funções soltas: apenas em `helpers.ts`
- Lógica agrupada: namespace ou class com DI
- Nunca lógica de negócio no router

### Types

Inferir quando possível: `z.infer<typeof schema>`, Kysely types. `types.ts` só para tipos de domínio complexos.

### Naming

| Item | Padrão |
|------|--------|
| Pastas/arquivos | kebab-case |
| Procedures | resource.action |
| Types/Namespaces | PascalCase |

### Error Handling

Sem try-catch. `safe()` para Result, `withErrorHandler()` para log + rethrow.

```ts
// Result pattern
const result = await safe(promise);
if (!result.ok) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

// Log + rethrow (substitui try-catch)
return withErrorHandler(fn, onError, { rethrowOnly?: predicate });
```

### Logging

JSONL async. Dual-write: `logs/daily/` + `logs/sessions/`. Cleanup 30d no startup.

```ts
logger.info("msg", { ctx });
logger.error("msg", error, { ctx });
logger.forSession(id).info("msg");  // escreve em ambos
truncate(str, max?)                  // para content longo
```

### Kysely

- `select([...])` com colunas específicas (não `selectAll()`)
- `executeTakeFirst()` para 1 item
- Transações para múltiplas tabelas

### Proibições

- output schemas, `any`, barrel exports
- funções soltas fora de helpers.ts
- try-catch, comentários
- `async` sem `return await`

## Database

Kysely + bun:sqlite. Arquivo: `kintsugi.db` (ou `KINTSUGI_DB_PATH`).

### Migrations

`src/db/migrations/NNN_descricao.ts` com `export async function up(db)`. Importar em `migrations/index.ts`. Forward-only (sem rollback).

## Models

**Project**: id, name, path, description, created_at

**Task**: id, project_id, title, description, branch_name, brainstorm, architecture, review

**Subtask**: id, task_id, name, acceptance_criterias, out_of_scope, category (code|test|docs|fix|refactor), status (waiting|in_progress|completed), started_at, finished_at, should_commit, key_decisions, files, notes

## Events (Real-time)

Event bus em `src/events/bus.ts` para notificar frontend de mudanças.

```ts
// Emitir evento
import { uiEventBus } from "../../events/bus";
uiEventBus.publish({ type: "session.statusChanged", sessionId, status });

// Frontend recebe via tRPC subscription (events.onInvalidate)
```

Types em `src/events/types.ts`. Discriminated union por `type`.

## Environment

| Var | Default | Descrição |
|-----|---------|-----------|
| `KINTSUGI_DB_PATH` | `kintsugi.db` | Caminho do SQLite |
