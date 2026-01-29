# Code Review: Sistema de IA do Kintsugi

## Visão Geral

O sistema implementa uma camada de abstração para múltiplos serviços de IA (Claude Code, OpenCode) com execução autônoma de subtasks, sessões persistidas, e eventos em tempo real.

---

## O Que Está Bom

### 1. Abstração Multi-Service Bem Feita

```
AiCore → BaseAiClient → ClaudeCodeClient / OpenCodeClient
```

- **Registry pattern** com lazy initialization funciona bem
- `modelsMap` normaliza model keys entre serviços — frontend agnóstico
- Fácil adicionar novos serviços no futuro

### 2. Event System Sólido

- Discriminated union para type-safety (`UiInvalidateEvent`)
- Pub/sub simples mas efetivo
- tRPC subscription integra bem com React Query

### 3. Separação de Responsabilidades

- Repositories abstraem DB
- Services encapsulam lógica de negócio
- Router só faz wiring

### 4. Prompt Engineering

- `buildExecutionPrompt` gera contexto rico para o agente
- Regras claras ("não pergunte, execute")

---

## Problemas Sérios

### 1. Estado In-Memory no ExecutionService

```typescript
const runs = new Map<string, ExecutionRun>();
```

**Problema:** Se o servidor reiniciar durante uma execução:

- `runs` é perdido
- Subtask fica em `in_progress` para sempre
- Sessão AI órfã rodando sem controle
- UI fica dessincronizada

**Fix necessário:** Persistir `ExecutionRun` no banco ou reconciliar estado no startup.

### 2. Race Conditions no Stop

```typescript
export function stop(taskId: string) {
  run.status = "stopping"; // Flag que é checada ENTRE subtasks
  if (run.currentSessionId) {
    AiService.stopSession(...); // Async, não awaited
  }
}
```

**Problemas:**

- Se subtask A termina e B começa antes do flag ser checado → B executa
- `stopSession` não é awaited — caller não sabe se parou
- Não há confirmação de que a sessão realmente parou

### 3. Hardcoded Paths e Config

```typescript
pathToClaudeCodeExecutable: "/home/jui/.bun/bin/claude",
hostname: "127.0.0.1",
port: 4096,
```

**Problema:** Hardcoded para uma máquina específica. Não vai funcionar em outro ambiente.

**Fix:** Usar env vars (`CLAUDE_EXECUTABLE_PATH`, `OPENCODE_HOST`, etc.)

### 4. Error Recovery Inexistente

Se uma subtask falha:

- Execução para
- Usuário tem que re-rodar manualmente
- Não há retry automático
- Não há opção de "skip and continue"

### 5. Sem Timeout nas Operações

```typescript
await AiService.sendMessage({ ... }); // Pode rodar indefinidamente
```

**Problema:** Claude Code pode travar, entrar em loop, ou demorar horas. Não há:

- Timeout configurável
- Heartbeat check durante execução
- Dead session detection

---

## Problemas Médios

### 6. Type Assertions Excessivas no Router

```typescript
input.modelKey as Parameters<typeof ExecutionService.runAll>[2];
```

**Problema:** Zod já validou, mas o type system não confia. Indica schema desalinhado com os types.

**Fix:** Usar `z.infer` para derivar types dos schemas.

### 7. Duplicação de Lógica Claude/OpenCode

Os dois clients têm ~60% de código similar:

- Status update patterns
- Message creation patterns
- Error handling

**Fix:** Mover para `BaseAiClient` ou criar mixins.

### 8. Polling no Frontend

```typescript
{ refetchInterval: 2000 } // Poll a cada 2s
```

**Problema:** Você já tem eventos! Use subscription em vez de polling.

### 9. Sem Validação de Scope

```typescript
scope: {
  projectId: project.id,
  repoPath: project.path, // Pode ser path inválido ou inacessível
  label: `execute:${taskId}:${subtaskId}`,
}
```

**Problema:** Se `project.path` não existe ou não é um repo, Claude Code vai falhar com erro confuso.

### 10. Sessões Órfãs

Quando uma execução é interrompida, a sessão AI fica no banco com `status: running`. Não há:

- Cleanup de sessões antigas
- Reconciliação no startup
- GC de sessões órfãs

---

## Code Smells

### 11. Namespace vs Module

```typescript
namespace ExecutionService {
  export function runAll(...) {}
}
```

**Opinião:** Namespaces são legacy TypeScript. Prefira módulos ES ou classes com DI.

### 12. Portuguese/English Mix

```typescript
pauseSession: "Pare e retorne agora.";
resumeSession: "Continue de onde estava.";
```

Consistência importa. Pick one.

### 13. Magic Strings

```typescript
label: `execute:${taskId}:${subtaskId}`;
```

Sem constantes, fácil de typar errado.

---

## Scorecard

| Aspecto         | Score | Notas                                              |
| --------------- | ----- | -------------------------------------------------- |
| **Arquitetura** | 7/10  | Boa abstração, mas estado in-memory é problema     |
| **Type Safety** | 6/10  | Usa Zod e types, mas muitos `as` casts             |
| **Error Handling** | 4/10 | Básico, sem recovery, sem retries                |
| **Resilience**  | 3/10  | Crash = estado perdido, sem reconciliation         |
| **Scalability** | 5/10  | Funciona para 1 usuário, problemas com concorrência|
| **Testability** | 7/10  | Repos mockáveis, DI presente                       |
| **Code Quality**| 7/10  | Limpo, consistente, algumas duplicações            |

**Overall: 5.5/10**

---

## Prioridades de Fix

1. **Crítico:** Persistir estado de execução no banco
2. **Crítico:** Configurar via env vars, não hardcode
3. **Alto:** Adicionar timeouts nas operações AI
4. **Alto:** Trocar polling por subscription no frontend
5. **Médio:** Cleanup de sessões órfãs
6. **Médio:** Retry/skip logic para falhas
