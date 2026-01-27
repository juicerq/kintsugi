import type { Project, Task, WorkflowStep } from "@/lib/types";

export function buildInitialPrompt(
	step: WorkflowStep,
	task: Task,
	project: Project,
): string {
	const builders: Record<WorkflowStep, () => string> = {
		brainstorm: () => buildBrainstormPrompt(task, project),
		architecture: () => buildArchitecturePrompt(task, project),
		review: () => buildReviewPrompt(task, project),
	};

	return builders[step]();
}

function buildBrainstormPrompt(task: Task, project: Project): string {
	const lines = [
		`Estou começando o brainstorm para a task "${task.title}".`,
		"",
		`Projeto: ${project.name} (${project.path})`,
		`Task ID: ${task.id}`,
	];

	if (task.description) {
		lines.push(`Descrição: ${task.description}`);
	}

	lines.push(
		"",
		"Vamos fazer um brainstorm juntos. Comece entendendo a task, proponha uma abordagem inicial curta e espere meu input. Quero iterar ideias — não despeje tudo de uma vez.",
		"",
		"Você tem acesso à CLI `kintsugi` para consultar e atualizar dados do projeto:",
		`- \`kintsugi task get ${task.id}\` — detalhes desta task`,
		`- \`kintsugi subtask list ${task.id}\` — subtasks existentes`,
		`- \`kintsugi task update ${task.id} --brainstorm "resultado"\` — salvar o brainstorm`,
		"- `kintsugi project list` — listar projetos",
		"",
		"Ao finalizar, salve o resultado do brainstorm usando o comando de update acima.",
	);

	return lines.join("\n");
}

function buildArchitecturePrompt(task: Task, project: Project): string {
	const sections = [
		`# Architecture

You are creating a concrete implementation plan for a development task.`,

		`## Context

- **Project:** ${project.name} (${project.path})
- **Task ID:** ${task.id}
- **Title:** ${task.title}${task.description ? `\n- **Description:** ${task.description}` : ""}`,

		task.brainstorm
			? `## Brainstorm Result

${task.brainstorm}`
			: null,

		`## Your Mission

### Phase 1: Research
Explore the codebase deeply BEFORE proposing anything. Read relevant files. Understand existing patterns, types, conventions, and architecture. You need a solid mental model of the current state before designing changes.

Use \`kintsugi task get ${task.id}\` to see all task details.

### Phase 2: Propose
Present the architecture covering:

1. **Implementation Plan** — What changes, in what order, why. Reference real files, real types, real patterns from the codebase.
2. **Key Decisions** — Schema changes, API contracts, new patterns, architectural trade-offs.
3. **Deep Modules** — Look for opportunities to extract modules that encapsulate significant functionality behind simple, testable interfaces that rarely change.
4. **Files** — New files to create (with purpose) and existing files to modify (with what changes).
5. **Out of Scope** — What explicitly will NOT be done as part of this task. Be clear about boundaries.
6. **Testing Plan** — Which parts need tests, what kind, and existing test patterns to follow.
7. **Subtasks** — Ordered, independently executable steps. Each subtask must be small enough for a single focused session.

### Phase 3: Confirm and Save
After presenting the architecture, ask: "Devo salvar esta arquitetura e criar as subtasks?"

Only after the user confirms:
1. Save the architecture: \`kintsugi task update ${task.id} --architecture "..."\`
2. Create all subtasks: \`kintsugi subtask create-batch ${task.id} --subtasks '[...]'\``,

		`## Subtask Schema

Each subtask in the batch accepts:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | yes | Clear, actionable name |
| category | "code" · "test" · "docs" · "fix" · "refactor" | no | Type of work |
| acceptanceCriterias | string[] | no | Concrete, verifiable criteria |
| outOfScope | string[] | no | What this subtask must NOT touch |
| steps | string[] | no | Ordered implementation steps — concrete commands, file operations, and checks the execution agent should follow |

### Example

\`\`\`json
[
  {
    "name": "Create WebSocket event bus",
    "category": "code",
    "acceptanceCriterias": [
      "EventBus class connects to WebSocket server",
      "Supports subscribe/unsubscribe by event type",
      "Auto-reconnects on disconnect"
    ],
    "outOfScope": [
      "Authentication",
      "Message persistence"
    ],
    "steps": [
      "Create src/lib/events/event-bus.ts",
      "Implement EventBus class with connect(), subscribe(), unsubscribe()",
      "Add auto-reconnect logic with exponential backoff",
      "Export from src/lib/events/index.ts",
      "Run bun tsc --noEmit"
    ]
  },
  {
    "name": "Add EventBus tests",
    "category": "test",
    "acceptanceCriterias": [
      "Tests connection lifecycle",
      "Tests subscribe/unsubscribe",
      "Tests auto-reconnect behavior"
    ],
    "outOfScope": [],
    "steps": [
      "Create src/lib/events/__tests__/event-bus.test.ts",
      "Test successful connection",
      "Test subscribe receives messages",
      "Test unsubscribe stops messages",
      "Test reconnect after disconnect",
      "Run bun test src/lib/events"
    ]
  }
]
\`\`\``,

		`## CLI Reference

- \`kintsugi task get ${task.id}\` — Task details (includes brainstorm)
- \`kintsugi subtask list ${task.id}\` — Existing subtasks
- \`kintsugi task update ${task.id} --architecture "result"\` — Save architecture
- \`kintsugi subtask create-batch ${task.id} --subtasks '[...]'\` — Create subtasks
- \`kintsugi project list\` — List projects`,

		`## Rules

- Research BEFORE proposing. Read files. Understand patterns.
- Be specific. Reference real files, real types, real patterns.
- Keep subtasks small — completable in a single focused session.
- Every subtask must have clear acceptance criteria and steps.
- Do NOT save or create anything until the user confirms.`,
	];

	return sections.filter(Boolean).join("\n\n");
}

function buildReviewPrompt(task: Task, project: Project): string {
	const lines = [
		`Estou começando a review para a task "${task.title}".`,
		"",
		`Projeto: ${project.name} (${project.path})`,
		`Task ID: ${task.id}`,
	];

	if (task.description) {
		lines.push(`Descrição: ${task.description}`);
	}

	lines.push(
		"",
		"Brainstorm e arquitetura já foram feitos. Revise o plano antes da execução: verifique completude, correção técnica, riscos e complexidade desnecessária.",
		"",
		"Você tem acesso à CLI `kintsugi`:",
		`- \`kintsugi task get ${task.id}\` — ver task completa`,
		`- \`kintsugi subtask list ${task.id}\` — ver subtasks planejadas`,
		`- \`kintsugi subtask update <id> --name "..." --notes "..."\` — ajustar subtasks`,
		`- \`kintsugi task update ${task.id} --review "resultado"\` — salvar a review`,
		"",
		"Ao finalizar, salve a review e ajuste subtasks se necessário.",
	);

	return lines.join("\n");
}
