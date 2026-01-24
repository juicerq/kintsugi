# Desktop

Tauri 2 shell with React frontend.

## Build Commands

**NEVER run `bun run build` or `vite build`** - there is no need to build the frontend manually. Tauri handles all builds.

For development verification, use `bunx tsc --noEmit` in the desktop folder if needed.

## Structure

```
desktop/
├── src/                    # React frontend
│   ├── routes/             # File-based routing (TanStack Router)
│   │   ├── __root.tsx      # Root layout (providers)
│   │   └── index.tsx       # Home page (/)
│   ├── trpc.ts             # tRPC client config
│   ├── main.tsx            # React entry
│   └── routeTree.gen.ts    # Auto-generated routes
├── src-tauri/              # Tauri/Rust (see below)
├── index.html
├── vite.config.ts
└── package.json
```

## Frontend

### Routing (TanStack Router)

File-based routing in `src/routes/`:
- `__root.tsx` - Root layout, wraps all pages
- `index.tsx` - Maps to `/`
- `about.tsx` - Maps to `/about`
- `users/$id.tsx` - Maps to `/users/:id`

Routes are auto-generated to `routeTree.gen.ts`.

### tRPC Client

```tsx
import { trpc } from '../trpc';

function MyComponent() {
  const { data } = trpc.myProcedure.useQuery({ name: 'world' });
  const mutation = trpc.createThing.useMutation();
}
```

## Tauri (src-tauri/)

Minimal Rust code - only spawns the sidecar server.

### Key Files

- `tauri.conf.json` - App config, externalBin for sidecar
- `capabilities/default.json` - Permissions (shell:allow-spawn)
- `src/lib.rs` - Sidecar spawn logic

### Sidecar

The server binary is spawned on app start:
```rust
app.shell().sidecar("kintsugi-server").spawn()
```

No Tauri invoke commands - all communication goes through tRPC.

## Routes

| Route | Description |
|-------|-------------|
| `/` | Home - Project list |
| `/projects/$id` | Project detail - Task list |
| `/tasks/$id` | Task detail - AI workflow stages |
| `/subtasks/$id` | Subtask detail - Isolated AI session |

## Task Detail Stages

1. **Brainstorm** - Idea exploration (optional)
2. **Architecture** - Technical design
3. **Review** - Validate all stages
4. **Subtasks** - AI-generated, each isolated session

## Conventions

### Geral

- File-based routing only (no manual route registration)
- tRPC for all server communication
- Providers go in `__root.tsx`
- **Evitar ternários** - preferir `&&` para renderização condicional:

```tsx
// ✅ CORRETO
{isLoading && <Spinner />}
{error && <ErrorMessage error={error} />}
{data && <Content data={data} />}

// ❌ ERRADO
{isLoading ? <Spinner /> : null}
{data ? <Content data={data} /> : error ? <ErrorMessage /> : null}
```

- **Evitar `mutateAsync`** - preferir `mutate` com callbacks `onSuccess`/`onError`:

```tsx
// ✅ CORRETO
const mutation = trpc.projects.create.useMutation({
  onSuccess: (data) => {
    navigate({ to: '/projects/$id', params: { id: data.id } });
  },
  onError: (error) => {
    toast.error(error.message);
  },
});

mutation.mutate({ name: 'New Project' });

// ❌ ERRADO
const mutation = trpc.projects.create.useMutation();

async function handleSubmit() {
  try {
    const data = await mutation.mutateAsync({ name: 'New Project' });
    navigate({ to: '/projects/$id', params: { id: data.id } });
  } catch (error) {
    toast.error(error.message);
  }
}
```

### Animações

Usar `motion` (framer-motion) para animações sutis, modernas e satisfatórias:

```tsx
import { motion, AnimatePresence } from "motion/react";

// Entrada/saída suave
<AnimatePresence>
  {visible && (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  )}
</AnimatePresence>
```

Princípios:
- **Sutileza**: movimentos pequenos (4-12px), durações curtas (150-300ms)
- **Propósito**: animar apenas o que muda para guiar atenção do usuário
- **Consistência**: usar `easeOut` para entradas, `easeIn` para saídas
- **AnimatePresence**: sempre usar para animações de entrada/saída condicional

### Arquivos

- **Nomes sempre em kebab-case**: `task-details.tsx`, `use-get-tasks.ts`
- **Um componente por arquivo**: NUNCA mais de um componente no mesmo arquivo
- **Single Responsibility**: cada arquivo faz uma coisa só

### Estrutura por Rota

Cada rota tem suas próprias pastas para código usado somente nela:

```
routes/
├── home/
│   ├── route.tsx           # A rota em si
│   ├── -components/        # Componentes exclusivos da rota (prefixo - evita virar rota)
│   │   └── task-card.tsx
│   ├── -hooks/             # Hooks exclusivos da rota
│   │   └── use-task-filters.ts
│   ├── types.ts            # Types exclusivos da rota
│   └── constants.ts        # Constantes exclusivas da rota
├── projects/
│   └── $id/
│       ├── route.tsx
│       ├── -components/
│       └── -hooks/
```

**IMPORTANTE**: Pastas dentro de `routes/` que NÃO são rotas devem ter prefixo `-` (ex: `-components`, `-hooks`). Isso evita que o TanStack Router as trate como rotas.

Se um type/constante é usado em **múltiplas rotas**, mover para:
- `src/types/` - Types compartilhados
- `src/constants/` - Constantes compartilhadas

### Types do tRPC

**SEMPRE** usar `RouterInputs` e `RouterOutputs` para types derivados do backend:

```tsx
// ✅ CORRETO - infere do tRPC
import type { RouterInputs, RouterOutputs } from '@kintsugi/shared';

type CreateTaskInput = RouterInputs['tasks']['create'];
type Task = RouterOutputs['tasks']['getById'];

// ❌ ERRADO - duplica types do backend
type Task = {
  id: string;
  title: string;
  // ...
};
```

### Filtros e Search Params

Filtros de página **SEMPRE** usam `validateSearch` do TanStack Router com schema Zod:

```tsx
// routes/tasks/route.tsx
import { z } from 'zod';

const taskFiltersSchema = z.object({
  status: z.enum(['pending', 'done', 'all']).optional().default('all'),
  search: z.string().optional(),
  projectId: z.string().optional(),
});

export const Route = createFileRoute('/tasks')({
  validateSearch: taskFiltersSchema,
  component: TasksPage,
});

// No componente
function TasksPage() {
  const { status, search } = Route.useSearch();
  // ...
}
```
