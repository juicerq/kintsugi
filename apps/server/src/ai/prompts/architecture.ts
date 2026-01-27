import type { ArchitectureInput } from "./types";

export function buildArchitecturePrompt(input: ArchitectureInput): string {
	const { project, task, brainstorm, fileTree, relevantFiles } = input;

	const fileContents = relevantFiles
		.map((f) => `### ${f.path}\n\`\`\`\n${f.content}\n\`\`\``)
		.join("\n\n");

	const sections = [
		`# Architecture

You are creating a concrete implementation plan for a development task. A brainstorm was already done — the approach has been chosen. Your job is to turn that approach into an actionable plan with specific files, changes, and subtasks.

Dive into the code. Be specific. Reference real files, real patterns, real types.`,

		`## Project

- **Name:** ${project.name}
- **Path:** ${project.path}${project.description ? `\n- **Description:** ${project.description}` : ""}`,

		`## Task

**${task.title}**${task.description ? `\n\n${task.description}` : ""}`,

		brainstorm
			? `## Brainstorm Result

${brainstorm}`
			: null,

		`## Project Structure

\`\`\`
${fileTree}
\`\`\``,

		relevantFiles.length > 0
			? `## Relevant Files

${fileContents}`
			: null,

		`## Instructions

Based on the chosen approach from the brainstorm, create a detailed implementation plan:

1. **Implementation plan** — What changes need to happen, in what order. Reference specific files and patterns from the codebase.
2. **Files to create** — New files with their purpose and what they should contain.
3. **Files to modify** — Existing files with what specifically changes in each.
4. **Subtasks** — Break the work into ordered, independently executable subtasks. Each subtask should be small enough for a single focused session.

## Output Format

### Plan
(High-level implementation strategy based on the chosen approach)

### Changes

#### New Files
- \`path/to/file.ts\` — (Purpose and what it contains)

#### Modified Files
- \`path/to/existing.ts\` — (What changes and why)

### Subtasks

For each subtask:

#### 1. (Subtask name)
- **Category:** code | test | docs | fix | refactor
- **Description:** (What this subtask does)
- **Acceptance Criteria:**
  - (Concrete, verifiable criteria)
- **Out of Scope:**
  - (What this subtask should NOT touch)
- **Files:** (Which files this subtask creates or modifies)

(Repeat for each subtask, in execution order)

### Dependencies
(Note any ordering constraints between subtasks — which ones must run before others)`,
	];

	return sections.filter(Boolean).join("\n\n");
}
