import type { ReviewInput } from "./types";

export function buildReviewPrompt(input: ReviewInput): string {
	const { project, task, brainstorm, architecture } = input;

	const sections = [
		`# Review

You are reviewing an implementation plan before execution. Your job is to catch problems, gaps, and risks BEFORE code is written. Be critical but constructive — the goal is to ship better code, not to block progress.`,

		`## Project

- **Name:** ${project.name}
- **Path:** ${project.path}${project.description ? `\n- **Description:** ${project.description}` : ""}`,

		`## Task

**${task.title}**${task.description ? `\n\n${task.description}` : ""}`,

		brainstorm
			? `## Brainstorm

${brainstorm}`
			: null,

		`## Architecture

${architecture}`,

		`## Instructions

Review the architecture plan against the original task and brainstorm. Check for:

1. **Completeness** — Does the plan fully address the task? Are there missing pieces?
2. **Correctness** — Are the proposed changes technically sound? Will they work with the existing codebase?
3. **Subtask quality** — Are subtasks well-scoped? Are acceptance criteria clear and verifiable? Are there missing subtasks?
4. **Risks** — Breaking changes, edge cases not covered, performance concerns, security issues.
5. **Unnecessary complexity** — Is anything over-engineered? Can something be simplified?
6. **Missing tests** — Are there subtasks for testing? Is test coverage adequate for the changes?

## Output Format

### Verdict: APPROVED | NEEDS CHANGES

### Summary
(One paragraph: overall assessment)

### Issues
(List each issue found. If none, say "No issues found.")

For each issue:
- **[Severity: critical | major | minor]** (Description of the issue)
  - **Suggestion:** (How to fix it)

### Subtask Adjustments
(Suggest changes to the subtask list if needed — add, remove, reorder, or modify subtasks)

### Notes
(Any other observations, suggestions for improvement, or things to keep in mind during execution)`,
	];

	return sections.filter(Boolean).join("\n\n");
}
