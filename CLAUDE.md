# Kintsugi

Desktop app (900x600): Tauri 2 + React + Bun tRPC.

Task management com AI workflow: Projects → Tasks → Brainstorm/Architecture/Review → Subtasks (AI-generated, isolated sessions).

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
