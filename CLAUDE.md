# Kintsugi

Desktop app (900x600): Tauri 2 + React + Bun tRPC.

Task management com AI workflow: Projects → Tasks → Brainstorm/Architecture/Review → Subtasks (AI-generated, isolated sessions).

## Testing Discipline

- Use TDD for everything: bugs, refactors, and new features.
- Start with a failing test that captures the expected behavior and edge cases.
- For new features, begin with CLI-level tests (flags, output, errors) and add unit tests for core logic.
- Verify the test fails for the right reason before implementing; keep tests green incrementally.

## Stack

| Layer | Tech |
|-------|------|
| Shell | Tauri 2 |
| Frontend | React 19 + TanStack Router/Query |
| Backend | Bun + tRPC + bun:sqlite (Kysely) |
| Types | tRPC end-to-end + Zod |

## Estrutura

```
apps/
├── desktop/     # Tauri + React (ver apps/desktop/CLAUDE.md)
└── server/      # Bun tRPC (ver apps/server/CLAUDE.md)
packages/
└── shared/      # AppRouter types
```

## Comandos

```bash
bun run dev:server     # tRPC server
bun run dev:desktop    # Tauri dev
bun run build:server   # Compila sidecar
bun run build          # Build completo
```

## Convenções Globais

- Nunca barrel imports
- tRPC para tudo (nunca Tauri invoke)
- Early returns, evitar else e nested ifs
- Planos concisos, sacrificar gramática por clareza

## TypeScript (Matt Pocock Style)

### Branded Types
IDs tipados previnem mistura acidental. Usar `Brand<T, Name>` de `lib/branded.ts`:
- `ProjectId`, `TaskId`, `SubtaskId`, `SessionId`
- Helper: `const taskId = id as TaskId` após validação

### Validação de Shape
`satisfies` > type assertion. Valida conformidade sem alargar tipo.

### Type Guards
Discriminated unions: usar type predicates (`e is T`) para narrowing seguro.

### Literal Preservation
`as const` em arrays/objetos para preservar tipos literais. Derivar unions: `(typeof arr)[number]`.

### Inferência
- Zod: `z.infer<typeof schema>`
- Funções: `ReturnType<typeof fn>`, `Parameters<typeof fn>`
- tRPC: `RouterInputs['x']['y']`, `RouterOutputs['x']['y']`

### Proibições
| Evitar | Usar |
|--------|------|
| `any` | `unknown` + guard |
| `as X` | `satisfies` / guard |
| `@ts-ignore` | investigar |
| `enum` | `as const` union |
| Type duplicado | Inferir da source |

## Verificação

Antes de commitar:
```bash
bun run lint                           # Biome (SEMPRE rodar primeiro)
cd apps/desktop && bunx tsc --noEmit   # Frontend types
cd apps/server && bun test             # Backend tests
```

Auto-fix: `bun run lint:fix`

## Gotchas

- Pastas em `routes/` sem prefixo `-` viram rotas (TanStack Router)
- `mutateAsync` perde loading state do React Query — preferir `mutate` + callbacks
- Schemas Zod: nunca definir output schema em procedures tRPC (inferência automática)
