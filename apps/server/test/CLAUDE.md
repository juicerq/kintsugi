# Tests

Padrões para testes no Kintsugi. Testes são documentação executável.

## Filosofia

- Teste comportamento, não implementação
- Um conceito por teste
- Testes devem falhar por um único motivo
- Se é difícil de testar, o design está errado

## Estrutura

```
apps/server/
├── test/
│   └── helpers.ts           # DB + factories centralizados
└── src/
    └── features/
        └── {feature}/
            ├── router.ts
            └── router.test.ts   # Testes co-localizados
```

Testes ficam ao lado do código que testam, com sufixo `.test.ts`.

## Naming

### Describe blocks

Refletem a unidade sendo testada:

```ts
describe("ProjectsRepository", () => {
  describe("create", () => { ... });
  describe("findById", () => { ... });
});
```

### Test names

Comportamento direto, sem "should":

```ts
// Correto
test("creates a project", ...)
test("returns undefined when not exists", ...)
test("throws when id is empty", ...)

// Errado
test("should create a project", ...)
test("it creates a project successfully", ...)
test("test project creation", ...)
```

**Padrão para edge cases:** `"<ação> when <condição>"`

## Anatomia do Teste

Segue Arrange-Act-Assert com linha em branco separando cada fase:

```ts
test("creates a project", async () => {
  const data = createProject({ name: "My App" });

  const created = await projects.create(data);

  expect(created.id).toBe(data.id);
  expect(created.name).toBe("My App");
  expect(created.created_at).toBeDefined();
});
```

**Regras:**
- Sem comentários `// Arrange` - a linha em branco já indica
- Act é sempre uma única operação
- Assert agrupa expects do mesmo conceito

## Assertions

### O que verificar por operação

| Operação | Verificar |
|----------|-----------|
| Create | Todos os campos + `created_at` com `toBeDefined()` |
| Read | Objeto correto ou `undefined` quando não existe |
| Update | Campos alterados + campos inalterados permanecem |
| Delete | Retorno + `findById` retorna `undefined` |
| List | Quantidade + filtros aplicados |

### Granularidade

Um conceito por teste, múltiplos expects permitidos:

```ts
// Correto - um conceito (criação)
test("creates a project", async () => {
  const created = await projects.create(data);

  expect(created.id).toBe(data.id);
  expect(created.name).toBe("My App");
  expect(created.created_at).toBeDefined();
});

// Errado - granularidade excessiva
test("creates project with correct id", ...)
test("creates project with correct name", ...)
test("creates project with timestamp", ...)
```

### Matchers preferidos

```ts
expect(value).toBe(primitive)        // igualdade estrita
expect(obj).toEqual(obj)             // igualdade profunda
expect(item).toBeDefined()           // existe
expect(item).toBeUndefined()         // não existe
expect(arr).toHaveLength(n)          // tamanho
expect(fn).toThrow()                 // erro síncrono
expect(promise).rejects.toThrow()    // erro async
```

## Helpers e Factories

Centralizados em `test/helpers.ts`:

```ts
// === Database ===
export function createTestDb() { ... }

// === Factories ===
export function createProject(overrides?: Partial<...>) { ... }
export function createTask(projectId: string, overrides?: Partial<...>) { ... }
export function createSubtask(taskId: string, overrides?: Partial<...>) { ... }

// === Cenários Compostos (quando necessário) ===
export function createProjectWithTasks(taskCount = 3) { ... }
```

### Regras

- Factories aceitam `overrides` para customizar campos
- IDs gerados com `crypto.randomUUID()` por padrão
- Entidades dependentes recebem ID do pai como primeiro argumento
- Valores default são mínimos válidos, não realistas

```ts
// Correto - mínimo válido
export function createProject(overrides = {}) {
  return {
    id: crypto.randomUUID(),
    name: "Test Project",
    path: "/tmp/test",
    description: null,
    ...overrides,
  };
}

// Errado - dados "realistas" que poluem
export function createProject(overrides = {}) {
  return {
    name: "My Amazing E-commerce Application v2",
    path: "/home/user/projects/ecommerce",
    description: "A full-featured online store...",
    ...overrides,
  };
}
```

## Isolamento

Cada teste recebe database in-memory via `beforeEach`:

```ts
describe("ProjectsRepository", () => {
  let db: ReturnType<typeof createTestDb>;
  let projects: ReturnType<typeof createProjectsRepository>;

  beforeEach(() => {
    db = createTestDb();
    projects = createProjectsRepository(db);
  });

  // testes...
});
```

### Regras

- Sem estado compartilhado entre testes
- Sem `beforeAll` para setup de dados
- Sem dependência de ordem de execução
- Sem `afterEach` para cleanup (DB descartado automaticamente)

## O que NÃO testar

### Implementação interna

```ts
// Errado - testa como funciona
test("calls db.insertInto", async () => {
  const spy = spyOn(db, "insertInto");
  await projects.create(data);
  expect(spy).toHaveBeenCalled();
});

// Correto - testa o que faz
test("creates a project", async () => {
  const created = await projects.create(data);
  expect(created.id).toBeDefined();
});
```

### Código de terceiros

```ts
// Errado - testa o Zod
test("zod validates email format", () => {
  expect(z.string().email().safeParse("invalid")).toEqual({ success: false, ... });
});

// Correto - testa seu schema
test("rejects invalid email", async () => {
  await expect(caller.register({ email: "invalid" })).rejects.toThrow();
});
```

### Código trivial

```ts
// Errado - getter óbvio
test("getId returns id", () => {
  expect(project.getId()).toBe(project.id);
});
```

### Mocks excessivos

```ts
// Errado - mock de tudo
test("creates project", async () => {
  const mockDb = { insertInto: vi.fn().mockReturnValue(...) };
  // teste não prova nada
});

// Correto - DB real in-memory
test("creates project", async () => {
  const db = createTestDb();
  // teste prova que funciona de verdade
});
```

## Executando Testes

```bash
# Todos os testes
bun test

# Arquivo específico
bun test src/db/repositories/projects.test.ts

# Watch mode
bun test --watch
```

## Checklist para novos testes

- [ ] Nome descreve comportamento, não implementação
- [ ] Arrange-Act-Assert com linhas em branco
- [ ] Usa factories de `test/helpers.ts`
- [ ] Verifica retorno E side effects quando aplicável
- [ ] Não mocka o que pode usar real (DB in-memory)
- [ ] Edge cases seguem padrão `"<ação> when <condição>"`
