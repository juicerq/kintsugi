# Tests

Testes co-localizados (`*.test.ts`). Helpers em `test/helpers.ts`.

## Naming

- Describe: unidade testada (`describe("ProjectsRepo", () => describe("create", ...))`)
- Test: comportamento direto, sem "should" (`test("creates a project", ...)`)
- Edge cases: `"<ação> when <condição>"`

## Anatomia

Arrange-Act-Assert separados por linha em branco. Act = única operação.

```ts
test("creates a project", async () => {
  const data = createProject({ name: "Test" });

  const created = await projects.create(data);

  expect(created.id).toBe(data.id);
  expect(created.created_at).toBeDefined();
});
```

## Assertions por Operação

| Op | Verificar |
|----|-----------|
| Create | Todos campos + timestamps com `toBeDefined()` |
| Read | Objeto correto ou `undefined` |
| Update | Campos alterados + inalterados permanecem |
| Delete | Retorno + `findById` retorna `undefined` |
| List | Quantidade + filtros aplicados |

## Factories

Em `test/helpers.ts`. Aceitam `overrides`, geram UUIDs, valores mínimos válidos (não "realistas").

```ts
export function createProject(overrides = {}) {
  return { id: crypto.randomUUID(), name: "Test", path: "/tmp", ...overrides };
}
```

## Isolamento

`beforeEach` cria DB in-memory novo. Sem estado compartilhado, sem `beforeAll` para dados, sem cleanup manual.

## NÃO Testar

- Implementação interna (spies em métodos privados)
- Código de terceiros (Zod, Kysely)
- Código trivial (getters)
- Mocks excessivos — usar DB real in-memory

## Comandos

```bash
bun test                    # Todos
bun test path/to.test.ts    # Específico
bun test --watch            # Watch
```
