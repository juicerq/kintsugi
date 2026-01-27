import { z } from "zod";
import { modelKeys } from "../../ai/models";
import type { createProjectsRepository } from "../../db/repositories/projects";
import type { createSubtasksRepository } from "../../db/repositories/subtasks";
import type { createTasksRepository } from "../../db/repositories/tasks";
import { publicProcedure, router } from "../../lib/trpc";
import { buildExecutionPrompt } from "./build-prompt";
import { ExecutionService } from "./service";

const modelKeySchema = z.enum(modelKeys as [string, ...string[]]);

const schemas = {
	runAll: z.object({
		taskId: z.string().uuid(),
		modelKey: modelKeySchema,
	}),
	runSingle: z.object({
		taskId: z.string().uuid(),
		subtaskId: z.string().uuid(),
		modelKey: modelKeySchema,
	}),
	stop: z.object({
		taskId: z.string().uuid(),
	}),
	getStatus: z.object({
		taskId: z.string().uuid(),
	}),
} as const;

type Deps = {
	subtasksRepo: ReturnType<typeof createSubtasksRepository>;
	tasksRepo: ReturnType<typeof createTasksRepository>;
	projectsRepo: ReturnType<typeof createProjectsRepository>;
};

export function createExecutionRouter(deps: Deps) {
	const serviceDeps = {
		...deps,
		buildPrompt: buildExecutionPrompt,
	};

	return router({
		runAll: publicProcedure
			.input(schemas.runAll)
			.mutation(({ input }) => {
				ExecutionService.runAll(
					input.taskId,
					serviceDeps,
					input.modelKey as Parameters<typeof ExecutionService.runAll>[2],
				);
				return { started: true };
			}),

		runSingle: publicProcedure
			.input(schemas.runSingle)
			.mutation(({ input }) => {
				ExecutionService.runSingle(
					input.subtaskId,
					input.taskId,
					serviceDeps,
					input.modelKey as Parameters<typeof ExecutionService.runSingle>[3],
				);
				return { started: true };
			}),

		stop: publicProcedure
			.input(schemas.stop)
			.mutation(({ input }) => {
				ExecutionService.stop(input.taskId);
				return { stopped: true };
			}),

		getStatus: publicProcedure
			.input(schemas.getStatus)
			.query(({ input }) => ExecutionService.getStatus(input.taskId)),
	});
}
