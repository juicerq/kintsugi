import type { ModelKey } from "../../ai/models";
import { AiService } from "../../ai/service";
import type { AiServiceName } from "../../ai/types";
import { uiEventBus } from "../../events/bus";
import type { ExecutionRun, ExecutionServiceDeps } from "./types";

const runs = new Map<string, ExecutionRun>();

namespace ExecutionService {
	export function getStatus(taskId: string): ExecutionRun | null {
		return runs.get(taskId) ?? null;
	}

	export async function runAll(
		taskId: string,
		deps: ExecutionServiceDeps,
		modelKey: ModelKey,
		service: AiServiceName = "claude",
	) {
		const existing = runs.get(taskId);
		if (existing && existing.status === "running") return;

		const run: ExecutionRun = {
			taskId,
			status: "running",
			currentSubtaskId: null,
			currentSessionId: null,
			error: null,
		};
		runs.set(taskId, run);

		uiEventBus.publish({ type: "execution.started", taskId });

		const subtasks = await deps.subtasksRepo.listByTask(taskId);
		const waiting = subtasks.filter((s) => s.status === "waiting");

		for (const subtask of waiting) {
			if (run.status === "stopping") break;

			await executeSubtask(run, subtask.id, taskId, deps, modelKey, service);

			if (run.status === "error") break;
		}

		if (run.status === "stopping") {
			run.status = "stopped";
			uiEventBus.publish({
				type: "execution.stopped",
				taskId,
				reason: "user",
			});
			return;
		}

		if (run.status === "error") {
			uiEventBus.publish({
				type: "execution.stopped",
				taskId,
				reason: "error",
			});
			return;
		}

		run.status = "completed";
		run.currentSubtaskId = null;
		run.currentSessionId = null;
		uiEventBus.publish({
			type: "execution.stopped",
			taskId,
			reason: "completed",
		});
	}

	export async function runSingle(
		subtaskId: string,
		taskId: string,
		deps: ExecutionServiceDeps,
		modelKey: ModelKey,
		service: AiServiceName = "claude",
	) {
		const existing = runs.get(taskId);
		if (existing && existing.status === "running") return;

		const run: ExecutionRun = {
			taskId,
			status: "running",
			currentSubtaskId: null,
			currentSessionId: null,
			error: null,
		};
		runs.set(taskId, run);

		uiEventBus.publish({ type: "execution.started", taskId });

		await executeSubtask(run, subtaskId, taskId, deps, modelKey, service);

		if (run.status !== "error") {
			run.status = "completed";
			run.currentSubtaskId = null;
			run.currentSessionId = null;
		}

		uiEventBus.publish({
			type: "execution.stopped",
			taskId,
			reason: run.status === "error" ? "error" : "completed",
		});
	}

	export function stop(taskId: string) {
		const run = runs.get(taskId);
		if (!run || run.status !== "running") return;

		run.status = "stopping";

		if (run.currentSessionId) {
			AiService.stopSession({
				service: "claude",
				sessionId: run.currentSessionId,
			});
		}
	}
}

async function executeSubtask(
	run: ExecutionRun,
	subtaskId: string,
	taskId: string,
	deps: ExecutionServiceDeps,
	modelKey: ModelKey,
	service: AiServiceName,
) {
	run.currentSubtaskId = subtaskId;

	await deps.subtasksRepo.update(subtaskId, {
		status: "in_progress",
		started_at: new Date().toISOString(),
	});

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
		run.status = "error";
		run.error = "Task or subtask not found";
		return;
	}

	const project = await deps.projectsRepo.findById(task.project_id);

	if (!project) {
		run.status = "error";
		run.error = "Project not found";
		return;
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

		run.currentSessionId = session.id;

		const prompt = deps.buildPrompt(subtask, task, project);

		await AiService.sendMessage({
			service,
			sessionId: session.id,
			content: prompt,
		});

		if (run.status === "stopping") return;

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
	} catch (err) {
		const errorMessage =
			err instanceof Error ? err.message : "Unknown error";

		await deps.subtasksRepo.update(subtaskId, {
			status: "failed",
			error: errorMessage,
			finished_at: new Date().toISOString(),
		});

		run.status = "error";
		run.error = errorMessage;
		run.currentSubtaskId = subtaskId;

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
	}
}

export { ExecutionService };
