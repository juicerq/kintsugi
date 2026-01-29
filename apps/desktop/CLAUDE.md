# Desktop

Tauri 2 + React frontend. Verificar com `bunx tsc --noEmit`. **NUNCA** rodar `bun run build`.

## Estrutura

```
src/
├── routes/            # TanStack Router (file-based)
│   ├── __root.tsx     # Root layout + providers
│   └── $param/        # Dynamic routes
├── components/ui/     # Componentes reutilizáveis
└── trpc.ts            # Cliente tRPC
```

```
src-tauri/             # Rust minimal - só spawna sidecar
├── tauri.conf.json    # Config + externalBin
└── src/lib.rs         # Spawn logic
```

## Rotas

| Rota | Descrição |
|------|-----------|
| `/` | Lista de projetos |
| `/projects/$id` | Projeto → tasks |
| `/tasks/$id` | Task → workflow stages |
| `/workflow/$taskId` | Sessão AI (brainstorm/architecture/review) |

## Convenções

### Gerais

- tRPC para toda comunicação (nunca Tauri invoke)
- File-based routing (nunca registrar rotas manualmente)
- Providers em `__root.tsx`
- Nomes em kebab-case: `task-card.tsx`, `use-filters.ts`
- Um componente por arquivo, single responsibility

### UI Text

Inglês, o mais curto possível: "New Task" não "Click here to create a new task"

### Tipografia

Usar `<Title>`, `<Text>`, `<Badge>` - nunca `<h1>`, `<p>` com classes manuais.

**Title**: `size`: xl/lg/default/sm | `variant`: default/muted

**Text** (hierarquia de opacidade):
| Variant | Opacity | Uso |
|---------|---------|-----|
| label | 35% | Section headers |
| faint | 40% | IDs, timestamps |
| muted | 50% | Secundário, placeholders |
| secondary | 60% | Conteúdo expandido |
| default | 70% | Corpo principal |
| primary | 90% | Destaque |

**Badge**: default/sky/violet/indigo/rose/emerald/amber (ver componente para cores)

### JSX

- Preferir `&&` sobre ternários: `{loading && <Spinner />}`
- Preferir `mutate` com `onSuccess`/`onError` sobre `mutateAsync` com try/catch

### Animações

Usar `motion/react` (framer-motion). Movimentos sutis (4-12px), durações curtas (150-300ms), `easeOut` entrada, `easeIn` saída. Sempre `AnimatePresence` para condicional.

### Estrutura por Rota

```
routes/tasks/$id/
├── route.tsx          # Página
├── -components/       # Prefixo - evita virar rota
├── -hooks/
└── types.ts
```

Compartilhado entre rotas → `src/types/`, `src/constants/`

### Types

Sempre inferir do tRPC: `RouterInputs['tasks']['create']`, `RouterOutputs['tasks']['get']`

Nunca duplicar types do backend manualmente.

### Hooks Complexos

Hooks >150 linhas: dividir em **mini-hooks no mesmo arquivo**, separados por seções `═══`.

Cada mini-hook encapsula estado + helpers de um domínio (messages, status, modals, api). Main hook compõe e orquestra.

### Search Params

Filtros com `validateSearch` + Zod schema. Acessar via `Route.useSearch()`.

### Real-time Events

Subscription tRPC para eventos do server:

```ts
trpc.events.onInvalidate.useSubscription(undefined, {
  onData(event) {
    // event.type discrimina: "session.statusChanged" | "session.newMessage" | ...
  },
});
```

Encapsular em hook dedicado (`useSessionEvents`, `useServerEvents`) — nunca inline no componente.

### Quando Extrair Componentes

| Situação | Ação |
|----------|------|
| JSX >50 linhas | Extrair para `-components/` |
| Usado 2+ vezes na rota | Extrair |
| Lógica própria (state, effects) | Extrair |
| Só renderiza props, <30 linhas | Pode ficar inline |
