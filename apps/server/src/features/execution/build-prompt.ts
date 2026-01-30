import type { createProjectsRepository } from "../../db/repositories/projects";
import type { createSubtasksRepository } from "../../db/repositories/subtasks";
import type { createTasksRepository } from "../../db/repositories/tasks";

type SubtaskRow = NonNullable<
	Awaited<ReturnType<ReturnType<typeof createSubtasksRepository>["findById"]>>
>;
type TaskRow = NonNullable<
	Awaited<ReturnType<ReturnType<typeof createTasksRepository>["findById"]>>
>;
type ProjectRow = NonNullable<
	Awaited<ReturnType<ReturnType<typeof createProjectsRepository>["findById"]>>
>;

export function buildExecutionPrompt(
	subtask: SubtaskRow,
	task: TaskRow,
	project: ProjectRow,
): string {
	const sections: (string | null)[] = [
		`# Execute Subtask

You are an autonomous AI agent executing a specific subtask. Complete it fully, then stop.`,

		`## Project

- **Name:** ${project.name}
- **Path:** ${project.path}${project.description ? `\n- **Description:** ${project.description}` : ""}`,

		`## Task Context

- **Title:** ${task.title}${task.description ? `\n- **Description:** ${task.description}` : ""}`,

		task.brainstorm
			? `### Brainstorm

${task.brainstorm}`
			: null,

		task.architecture
			? `### Architecture

${task.architecture}`
			: null,

		task.review
			? `### Review

${task.review}`
			: null,

		buildSubtaskSection(subtask),

		`## Rules

- Work autonomously — do NOT ask questions, just execute
- Follow the steps in order
- If a step is unclear, use your best judgment
- Verify your work compiles: \`bunx tsc --noEmit\` if applicable
- When done, stop. Do not continue to other subtasks`,
	];

	return sections.filter(Boolean).join("\n\n");
}

function buildSubtaskSection(subtask: SubtaskRow): string {
	const lines = [`## Subtask: ${subtask.name}`, ""];

	if (subtask.category) {
		lines.push(`**Category:** ${subtask.category}`);
	}

	const criterias = parseJsonArray(subtask.acceptance_criterias);
	if (criterias.length > 0) {
		lines.push("", "### Acceptance Criteria", "");
		for (const c of criterias) {
			lines.push(`- ${c}`);
		}
	}

	const outOfScope = parseJsonArray(subtask.out_of_scope);
	if (outOfScope.length > 0) {
		lines.push("", "### Out of Scope", "");
		for (const o of outOfScope) {
			lines.push(`- ${o}`);
		}
	}

	const steps = parseJsonArray(subtask.steps);
	if (steps.length > 0) {
		lines.push("", "### Steps", "");
		for (let i = 0; i < steps.length; i++) {
			lines.push(`${i + 1}. ${steps[i]}`);
		}
	}

	return lines.join("\n");
}

function parseJsonArray(value: string | null): string[] {
	if (!value) return [];
	try {
		const parsed = JSON.parse(value);
		if (Array.isArray(parsed)) return parsed;
		return [];
	} catch {
		return [];
	}
}
