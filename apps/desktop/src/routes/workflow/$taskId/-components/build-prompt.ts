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
	const lines = [
		`Estou começando a arquitetura para a task "${task.title}".`,
		"",
		`Projeto: ${project.name} (${project.path})`,
		`Task ID: ${task.id}`,
	];

	if (task.description) {
		lines.push(`Descrição: ${task.description}`);
	}

	lines.push(
		"",
		"O brainstorm já foi feito. Crie um plano de implementação detalhado com arquivos a criar/modificar e quebre o trabalho em subtasks executáveis.",
		"",
		"Você tem acesso à CLI `kintsugi`:",
		`- \`kintsugi task get ${task.id}\` — ver task (inclui brainstorm)`,
		`- \`kintsugi subtask create-batch ${task.id} --subtasks '[{"name":"...","category":"code"}]'\` — criar subtasks`,
		`- \`kintsugi task update ${task.id} --architecture "resultado"\` — salvar a arquitetura`,
		"",
		"Ao finalizar, salve a arquitetura e crie as subtasks.",
	);

	return lines.join("\n");
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
