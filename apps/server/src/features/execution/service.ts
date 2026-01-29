import type { ModelKey } from "../../ai/models";
import { AiService } from "../../ai/service";
import type { AiServiceName } from "../../ai/types";
import { uiEventBus } from "../../events/bus";
import { logger } from "../../lib/logger";
import type { ExecutionRun, ExecutionRunStatus, ExecutionServiceDeps } from "./types";

function rowToRun(row: {
	id: string;
	task_id: string;
	status: string;
	current_subtask_id: string | null;
	current_session_id: string | null;
	error: string | null;
	service: string;
}): ExecutionRun {
	return {
		id: row.id,
		taskId: row.task_id,
		status: row.status as ExecutionRunStatus,
		currentSubtaskId: row.current_subtask_id,
		currentSessionId: row.current_session_id,
		error: row.error,
		service: row.service as AiServiceName,
	};
}

namespace ExecutionService {
	export async function getStatus(
		taskId: string,
		deps: ExecutionServiceDeps,
	): Promise<ExecutionRun | null> {
		const row = await deps.executionRunsRepo.findActiveByTask(taskId);
		if (!row) return null;
		return rowToRun(row);
	}

	export async function runAll(
		taskId: string,
		deps: ExecutionServiceDeps,
		modelKey: ModelKey,
		service: AiServiceName = "claude",
	) {
		const existing = await deps.executionRunsRepo.findActiveByTask(taskId);
		if (existing && existing.status === "running") return;

		const runId = crypto.randomUUID();
		await deps.executionRunsRepo.create({
			id: runId,
			task_id: taskId,
			status: "running",
			current_subtask_id: null,
			current_session_id: null,
			error: null,
			service,
			finished_at: null,
		});

		uiEventBus.publish({ type: "execution.started", taskId });

		const subtasks = await deps.subtasksRepo.listByTask(taskId);
		const waiting = subtasks.filter((s) => s.status === "waiting");

		logger.info("Execution started", {
			executionId: runId,
			taskId,
			subtaskCount: waiting.length,
			service,
		});

		let currentStatus: ExecutionRunStatus = "running";

		for (const subtask of waiting) {
			const row = await deps.executionRunsRepo.findActiveByTask(taskId);
			if (row?.status === "stopping") {
				currentStatus = "stopping";
				break;
			}

			const result = await executeSubtask(
				runId,
				subtask.id,
				taskId,
				deps,
				modelKey,
				service,
			);

			if (result === "error") {
				currentStatus = "error";
				break;
			}
			if (result === "stopping") {
				currentStatus = "stopping";
				break;
			}
		}

		if (currentStatus === "stopping") {
			await deps.executionRunsRepo.update(runId, {
				status: "stopped",
				current_subtask_id: null,
				current_session_id: null,
				finished_at: new Date().toISOString(),
			});
			uiEventBus.publish({
				type: "execution.stopped",
				taskId,
				reason: "user",
			});
			logger.info("Execution stopped", { executionId: runId, taskId, reason: "user" });
			return;
		}

		if (currentStatus === "error") {
			await deps.executionRunsRepo.update(runId, {
				finished_at: new Date().toISOString(),
			});
			uiEventBus.publish({
				type: "execution.stopped",
				taskId,
				reason: "error",
			});
			logger.warn("Execution stopped", { executionId: runId, taskId, reason: "error" });
			return;
		}

		await deps.executionRunsRepo.update(runId, {
			status: "completed",
			current_subtask_id: null,
			current_session_id: null,
			finished_at: new Date().toISOString(),
		});
		uiEventBus.publish({
			type: "execution.stopped",
			taskId,
			reason: "completed",
		});
		logger.info("Execution completed", { executionId: runId, taskId });
	}

	export async function runSingle(
		subtaskId: string,
		taskId: string,
		deps: ExecutionServiceDeps,
		modelKey: ModelKey,
		service: AiServiceName = "claude",
	) {
		const existing = await deps.executionRunsRepo.findActiveByTask(taskId);
		if (existing && existing.status === "running") return;

		const runId = crypto.randomUUID();
		await deps.executionRunsRepo.create({
			id: runId,
			task_id: taskId,
			status: "running",
			current_subtask_id: null,
			current_session_id: null,
			error: null,
			service,
			finished_at: null,
		});

		uiEventBus.publish({ type: "execution.started", taskId });

		logger.info("Execution started", {
			executionId: runId,
			taskId,
			subtaskCount: 1,
			service,
		});

		const result = await executeSubtask(
			runId,
			subtaskId,
			taskId,
			deps,
			modelKey,
			service,
		);

		if (result !== "error") {
			await deps.executionRunsRepo.update(runId, {
				status: "completed",
				current_subtask_id: null,
				current_session_id: null,
				finished_at: new Date().toISOString(),
			});
		} else {
			await deps.executionRunsRepo.update(runId, {
				finished_at: new Date().toISOString(),
			});
		}

		uiEventBus.publish({
			type: "execution.stopped",
			taskId,
			reason: resul === "error" ? "error" : "completed",
		});

		if (result === "error") {
			logger.warn("Execution stopped", { executionId: runId, taskId, reason: "error" });
		} else {
			logger.info("Execution completed", { executionId: runId, taskId });
		}
	}

	export async function stop(taskId: string, deps: ExecutionServiceDeps) {
		const run = await deps.executionRunsRepo.findActiveByTask(taskId);
		if (!run || run.status !== "running") return;

		await deps.executionRunsRepo.update(run.id, { status: "stopping" });

		if (run.current_session_id) {
			AiService.stopSession({
				service: run.service as AiServiceName,
				sessionId: run.current_session_id,
			});
		}
	}
}

async function executeSubtask(
	runId: string,
	subtaskId: string,
	taskId: string,
	deps: ExecutionServiceDeps,
	modelKey: ModelKey,
	service: AiServiceName,
): Promise<"ok" | "error" | "stopping"> {
	await deps.executionRunsRepo.update(runId, {
		current_subtask_id: subtaskId,
	});

	await deps.subtasksRepo.update(subtaskId, {
		status: "in_progress",
		started_at: new Date().toISOString(),
	});

	logger.info("Subtask started", { executionId: runId, subtaskId, taskId });

	uiEventBus.publish({
		type: "subtask.updated",
		subtaskId,
		taskId,
	});
	uiEventBus.publish({
		type: "execution.subtaskStarted",
		taskId,
		subtaskId,
	});

	const task = await deps.tasksRepo.findById(taskId);
	const subtask = await deps.subtasksRepo.findById(subtaskId);

	if (!task || !subtask) {
		await deps.executionRunsRepo.update(runId, {
			status: "error",
			error: "Task or subtask not found",
		});
		return "error";
	}

	const project = await deps.projectsRepo.findById(task.project_id);

	if (!project) {
		await deps.executionRunsRepo.update(runId, {
			status: "error",
			error: "Project not found",
		});
		return "error";
	}

	try {
		const session = await AiService.createSession({
			service,
			modelKey,
			title: `execute: ${subtask.name}`,
			scope: {
				projectId: project.id,
				repoPath: project.path,
				label: `execute:${taskId}:${subtaskId}`,
			},
			allowedTools: ["Bash", "Read", "Glob", "Grep", "LS", "Edit", "Write"],
			permissionMode: "acceptEdits",
		});

		await deps.executionRunsRepo.update(runId, {
			current_session_id: session.id,
		});

		const prompt = deps.buildPrompt(subtask, task, project);

		await AiService.sendMessage({
			service,
			sessionId: session.id,
			content: prompt,
		});

		const run = await deps.executionRunsRepo.findActiveByTask(taskId);
		if (run?.status === "stopping") return "stopping";

		await deps.subtasksRepo.update(subtaskId, {
			status: "completed",
			finished_at: new Date().toISOString(),
		});

		uiEventBus.publish({
			type: "subtask.updated",
			subtaskId,
			taskId,
		});
		uiEventBus.publish({
			type: "execution.subtaskCompleted",
			taskId,
			subtaskId,
		});

		logger.info("Subtask completed", { executionId: runId, subtaskId, taskId });

		return "ok";
	} catch (err) {
		const errorMessage =
			err instanceof Error ? err.message : "Unknown error";

		await deps.subtasksRepo.update(subtaskId, {
			status: "failed",
			error: errorMessage,
			finished_at: new Date().toISOString(),
		});

		await deps.executionRunsRepo.update(runId, {
			status: "error",
			error: errorMessage,
			current_subtask_id: subtaskId,
		});

		uiEventBus.publish({
			type: "subtask.updated",
			subtaskId,
			taskId,
		});
		uiEventBus.publish({
			type: "execution.subtaskFailed",
			taskId,
			subtaskId,
			error: errorMessage,
		});

		logger.error("Subtask failed", err instanceof Error ? err : null, { executionId: runId, subtaskId, taskId });

		return "error";
	}
}

export { ExecutionService };
