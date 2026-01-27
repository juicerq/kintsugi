import type { BrainstormInput } from "./types";

export function buildBrainstormPrompt(input: BrainstormInput): string {
	const { project, task, fileTree, projectDocs } = input;

	const sections = [
		`# Brainstorm

You are exploring approaches for a development task. Your job is to think broadly about **what** to do and **why** — not how to implement it in code. Do not write code. Do not reference specific functions or internal logic. Focus on approaches, trade-offs, and reasoning.

You have access to the project structure and documentation to understand the landscape, but you should NOT dive into implementation details.`,

		`## Project

- **Name:** ${project.name}
- **Path:** ${project.path}${project.description ? `\n- **Description:** ${project.description}` : ""}`,

		`## Task

**${task.title}**${task.description ? `\n\n${task.description}` : ""}`,

		`## Project Structure

\`\`\`
${fileTree}
\`\`\``,

		projectDocs
			? `## Project Documentation

${projectDocs}`
			: null,

		`## Instructions

1. **Understand** the task fully. Restate it in your own words to confirm understanding.
2. **Explore 2-3 approaches.** For each:
   - Describe the approach clearly
   - List pros and cons
   - Identify risks or unknowns
3. **Recommend one approach** with clear reasoning for why it's the best fit.
4. **List considerations** — edge cases, things to watch out for, questions that need answering.

## Output Format

### Understanding
(Your interpretation of what this task requires)

### Approaches

#### Approach 1: (Name)
(Description)
- **Pros:** ...
- **Cons:** ...
- **Risks:** ...

#### Approach 2: (Name)
(Description)
- **Pros:** ...
- **Cons:** ...
- **Risks:** ...

(Add more if relevant)

### Recommendation
(Which approach and why)

### Considerations
(Edge cases, open questions, things to watch out for)`,
	];

	return sections.filter(Boolean).join("\n\n");
}
