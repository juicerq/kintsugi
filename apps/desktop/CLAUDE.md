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

### UI Text

All UI text must be in **English** and as **short as possible** while maintaining clarity:

```tsx
// ✅ CORRECT
"New Task"
"Delete this?"
"No tasks yet"
"Saved"

// ❌ WRONG
"Click here to create a new task"
"Are you sure you want to delete this item?"
"No tasks have been created yet"
"Successfully saved"
```

### Tipografia

**SEMPRE** usar `<Title>` e `<Text>` ao invés de `<h1>`, `<p>` com classes manuais:

```tsx
// ✅ CORRETO
import { Title } from "@/components/ui/title"
import { Text } from "@/components/ui/text"

<Title>Título do card</Title>
<Title size="lg">Título grande</Title>
<Text>Texto secundário</Text>
<Text variant="muted">Texto muted</Text>

// ❌ ERRADO
<h2 className="text-[13px] font-medium text-white/90 tracking-[-0.01em]">Título</h2>
<p className="text-[12px] text-white/50">Texto</p>
```

**Title** - para títulos e headings:
- `variant`: `default` (white/90), `muted` (white/50 - completed/disabled)
- `size`: `xl` (19px), `lg` (15px), `default` (12px), `sm` (11px)
- `asChild`: renderiza como outro elemento (`<Title asChild><h1>...</h1></Title>`)

**Text** - para texto corrido (hierarquia do mais sutil ao mais forte):
| Variant     | Opacity | Uso                                    |
|-------------|---------|----------------------------------------|
| `label`     | 35%     | Section headers (Steps, Details, Task) |
| `faint`     | 40%     | IDs, timestamps, metadata              |
| `muted`     | 50%     | Texto secundário, placeholders         |
| `secondary` | 60%     | Steps, conteúdo expandido              |
| `default`   | 70%     | Corpo principal                        |
| `primary`   | 90%     | Títulos, texto de destaque             |

- `size`: `default` (12px), `sm` (11px), `xs` (10px), `xxs` (9px)
- `weight`: `normal`, `medium`
- `asChild`: renderiza como outro elemento

**Badge** - para status, categorias, tags (estilo pill 9px uppercase):
| Variant   | Cor                          | Uso                    |
|-----------|------------------------------|------------------------|
| `default` | white/10 + white/40          | Neutro, waiting        |
| `sky`     | sky-500/15 + sky-400         | Code                   |
| `violet`  | violet-500/15 + violet-400   | Test                   |
| `indigo`  | indigo-500/15 + indigo-400   | Docs                   |
| `rose`    | rose-500/15 + rose-400       | Fix                    |
| `emerald` | emerald-500/15 + emerald-400 | Refactor, completed    |
| `amber`   | amber-500/15 + amber-400     | In progress, warning   |

```tsx
<Badge variant="sky">
  <Code className="h-2.5 w-2.5" />
  Code
</Badge>
```

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
