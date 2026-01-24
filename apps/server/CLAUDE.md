# Server

Bun tRPC server that compiles to a sidecar binary for Tauri.

## Structure

```
server/
├── src/
│   ├── features/
│   │   └── {feature-name}/      # kebab-case sempre
│   │       ├── router.ts        # Procedures da feature
│   │       ├── schemas.ts       # Zod schemas (input only)
│   │       ├── types.ts         # TypeScript types
│   │       ├── service.ts       # Lógica de negócio (namespace/class)
│   │       ├── helpers.ts       # Funções utilitárias (único lugar para funções soltas)
│   │       └── *.test.ts        # Testes co-localizados
│   ├── db/
│   │   ├── index.ts             # Kysely instance
│   │   ├── schema.ts            # CREATE TABLE statements
│   │   └── types.ts             # Database types
│   ├── lib/
│   │   ├── trpc.ts              # tRPC instance + procedures base
│   │   ├── types.ts             # Utility types (Maybe, Result)
│   │   └── safe.ts              # Error handling helpers
│   ├── router.ts                # Root router (merge features)
│   └── index.ts                 # Bun.serve entry
└── tsconfig.json
```

## Conventions

### Routers e Schemas

Schemas SEMPRE no mesmo arquivo do router, usando `const` com namespace:

```ts
// features/auth/router.ts
import { z } from "zod";
import { publicProcedure, router } from "../../lib/trpc";

const schemas = {
  login: z.object({
    email: z.string().email(),
    password: z.string().min(8),
  }),
  register: z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().min(2),
  }),
} as const;

export const authRouter = router({
  login: publicProcedure
    .input(schemas.login)
    .mutation(({ input }) => {
      // Deixe tRPC inferir o output - NUNCA defina output schema
      return { token: "...", user: { id: "1", email: input.email } };
    }),
});
```

### Organização de Código

```ts
// ERRADO - função solta
function calculateTotal(items: Item[]) { ... }

// CERTO - namespace para agrupar funções relacionadas
namespace OrderCalculator {
  export function total(items: Item[]) { ... }
  export function discount(total: number, code: string) { ... }
}

// CERTO - classe simples quando há estado inicial
class ProjectService {
  constructor(private db: Database) {}

  async create(data: CreateProject) { ... }
  async findById(id: string) { ... }
}

// EXCEÇÃO - helpers.ts pode ter funções soltas (utilitários puros)
// features/task/helpers.ts
export function slugify(text: string) { ... }
export function generateId() { ... }
```

### Tipos

- `types.ts` por feature para tipos específicos do domínio
- Deixe Zod/tRPC/Kysely inferir quando possível
- Use `z.infer<typeof schema>` ao invés de duplicar tipos

```ts
// features/project/types.ts
export type ProjectStatus = "active" | "archived" | "completed";

export interface ProjectWithTasks {
  project: Project;
  tasks: Task[];
  stats: { total: number; completed: number };
}

// Inferência de schema
type LoginInput = z.infer<typeof schemas.login>;
```

### Naming

| Item | Convenção | Exemplo |
|------|-----------|---------|
| Pastas | kebab-case | `user-settings/` |
| Arquivos | kebab-case | `project-service.ts` |
| Procedures | resource.action | `project.create`, `task.list` |
| Schemas const | `schemas.{action}` | `schemas.create`, `schemas.update` |
| Types | PascalCase | `ProjectWithTasks` |
| Namespaces | PascalCase | `OrderCalculator` |

### Imports

Ordem: externos → internos → tipos

```ts
// 1. Externos
import { z } from "zod";
import { TRPCError } from "@trpc/server";

// 2. Internos (caminho relativo)
import { db } from "../../db";
import { publicProcedure, router } from "../../lib/trpc";
import { ProjectService } from "./service";

// 3. Tipos (se separados)
import type { ProjectWithTasks } from "./types";
```

### Error Handling

Sem try-catch. Use early returns ou helper `safe()` para operações que podem falhar:

```ts
// lib/types.ts
type Maybe<T> = T | null;
type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

// lib/safe.ts

export async function safe<T>(promise: Promise<T>): Promise<Result<T>> {
  return promise
    .then((value) => ({ ok: true as const, value }))
    .catch((error) => ({ ok: false as const, error }));
}

// Uso no service
const result = await safe(db.selectFrom("projects").execute());
if (!result.ok) {
  throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: result.error.message });
}
return result.value;
```

Prefira early returns para validações:

```ts
// CERTO - early return
.mutation(async ({ input }) => {
  const project = await ProjectService.findById(input.id);
  if (!project) {
    throw new TRPCError({ code: "NOT_FOUND", message: `Project ${input.id} not found` });
  }
  return project;
})

// ERRADO - try-catch
.mutation(async ({ input }) => {
  try {
    const project = await ProjectService.findById(input.id);
    return project;
  } catch (e) {
    throw new TRPCError({ code: "NOT_FOUND" });
  }
})
```

### Performance

- Use `selectAll()` apenas quando precisar de todas as colunas
- Prefira `select([...])` com colunas específicas
- Use `executeTakeFirst()` para queries que retornam 1 item
- Batch operations quando possível (insert múltiplos)
- Transações para operações que afetam múltiplas tabelas

```ts
// Transação
await db.transaction().execute(async (trx) => {
  const project = await trx
    .insertInto("projects")
    .values(projectData)
    .returningAll()
    .executeTakeFirstOrThrow();

  await trx
    .insertInto("tasks")
    .values(tasks.map(t => ({ ...t, project_id: project.id })))
    .execute();

  return project;
});
```

### Proibições

- **NUNCA** output schemas em procedures (deixe tRPC inferir)
- **NUNCA** `any` - use `unknown` + type guards
- **NUNCA** funções soltas fora de `helpers.ts`
- **NUNCA** barrel exports (`index.ts` que só re-exporta)
- **NUNCA** lógica de negócio dentro do router (extraia para service)
- **NUNCA** try-catch blocks - use early returns ou helper `safe()`
- **NUNCA** comentários - código deve ser auto-explicativo
- **NUNCA** `async` sem `return await` - sempre `return await` para stack traces corretos

## Build

```bash
bun run build  # Outputs to apps/desktop/src-tauri/binaries/
```

Compila para binário standalone via `bun build --compile`.

## Database

Kysely com `bun:sqlite`. Arquivo: `kintsugi.db` (ou `KINTSUGI_DB_PATH` env).

Schema auto-inicializa no start via `db/schema.ts`.

## Data Models

### Project
- id, name, path, description, created_at

### Task
- id, project_id, title, description
- branch_name
- brainstorm, architecture, review

### Subtask
- id, task_id, name
- acceptance_criterias (JSON), out_of_scope (JSON)
- category: code | test | docs | fix | refactor
- status: waiting | in_progress | completed
- started_at, finished_at
- should_commit: boolean
- key_decisions (JSON), files (JSON), notes
