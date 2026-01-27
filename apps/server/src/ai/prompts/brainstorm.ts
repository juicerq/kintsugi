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

Start by understanding the task. Restate it briefly to confirm you got it right, then propose ONE initial approach — keep it concise (a few paragraphs max).

Then **stop and wait for my input.** This is a conversation, not a monologue. I want to iterate on ideas together — challenge your approach, suggest alternatives, ask questions. You do the same with mine.

**Rules:**
- Keep responses short and focused. No walls of text.
- Don't dump all approaches at once. We explore one at a time.
- Push back if you think my idea has issues. Be direct.
- Ask clarifying questions when something is ambiguous.
- Only when we both agree on a direction, summarize the final approach.`,
	];

	return sections.filter(Boolean).join("\n\n");
}
