import type { AiServiceName } from "../../ai/types";
import type { createExecutionRunsRepository } from "../../db/repositories/execution-runs";
import type { createProjectsRepository } from "../../db/repositories/projects";
import type { createSubtasksRepository } from "../../db/repositories/subtasks";
import type { createTasksRepository } from "../../db/repositories/tasks";

export type ExecutionRunStatus =
	| "running"
	| "stopping"
	| "stopped"
	| "completed"
	| "error";

export type ExecutionRun = {
	id: string;
	taskId: string;
	status: ExecutionRunStatus;
	currentSubtaskId: string | null;
	currentSessionId: string | null;
	error: string | null;
	service: AiServiceName;
};

export type ExecutionServiceDeps = {
	subtasksRepo: ReturnType<typeof createSubtasksRepository>;
	tasksRepo: ReturnType<typeof createTasksRepository>;
	projectsRepo: ReturnType<typeof createProjectsRepository>;
	executionRunsRepo: ReturnType<typeof createExecutionRunsRepository>;
	buildPrompt: (subtask: SubtaskRow, task: TaskRow, project: ProjectRow) => string;
};

type SubtaskRow = NonNullable<
	Awaited<ReturnType<ReturnType<typeof createSubtasksRepository>["findById"]>>
>;
type TaskRow = NonNullable<
	Awaited<ReturnType<ReturnType<typeof createTasksRepository>["findById"]>>
>;
type ProjectRow = NonNullable<
	Awaited<ReturnType<ReturnType<typeof createProjectsRepository>["findById"]>>
>;
