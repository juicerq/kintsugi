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

### Composição

#### 3. Usar Composição ao invés de Props Booleanas

Cada prop booleana dobra os estados possíveis do componente, criando complexidade exponencial.

```typescript
// Ruim: Complexidade exponencial
function Composer({
  isThread,
  isDMThread,
  isEditing,
  isForwarding,
}: Props) {
  if (isDMThread) {
    ...
  } else if (isThread) {
    ...
  }
  // Condicionais impossíveis de manter
}

// Bom: Variantes explícitas via composição
function ChannelComposer() {
  return (
    <Composer.Frame>
      <Composer.Header />
      <Composer.Input />
      <Composer.Footer>
        <Composer.Attachments />
        <Composer.Submit />
      </Composer.Footer>
    </Composer.Frame>
  );
}
```

#### 4. Compound Components com Context

Estruture componentes complexos com contexto compartilhado, eliminando prop drilling.

```typescript
interface ComposerState {
  input: string;
  attachments: Attachment[];
  isSubmitting: boolean;
}

interface ComposerActions {
  update: (updater: (state: ComposerState) => ComposerState) => void;
  submit: () => void;
}

const ComposerContext = createContext<{
  state: ComposerState;
  actions: ComposerActions;
} | null>(null);

function ComposerProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ComposerState>(initialState);

  const actions: ComposerActions = {
    update: setState,
    submit: () => {
      /* ... */
    },
  };

  return (
    <ComposerContext.Provider value={{ state, actions }}>
      {children}
    </ComposerContext.Provider>
  );
}
```

Consumo: desestruture apenas o slice necessario do contexto. Evite acessar `session.x.y` direto quando so precisa de um sub-objeto.

```ts
const {
  session: { chatInput },
} = useWorkflowSessionContext();
```

### useEffect (escape hatch)

Use `useEffect` apenas para sincronizar com sistemas externos (DOM, subscriptions, timers, network, third-party).

Evite usos comuns (use render/eventos no lugar):

- Estado derivado de props/state -> calcule no render ou use `useMemo`
- Acoes de usuario (POST, navigate, log) -> event handlers
- Reset de state por prop -> `key` ou estado derivado
- Store externa -> `useSyncExternalStore`
- Data fetching -> TanStack Query / tRPC hooks (se usar `useEffect`, sempre cleanup + race guard)

Regras:

- Dependencies devem incluir todos valores reativos; nunca desativar exhaustive-deps
- Effect precisa ser idempotente e ter cleanup correto (Strict Mode roda setup+cleanup duas vezes)
- Nao usar `useRef` para "rodar uma vez" ou burlar Strict Mode
- Se precisar ler layout antes do paint, use `useLayoutEffect` (raro)

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
