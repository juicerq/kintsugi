import { z } from "zod";
import { modelKeySchema } from "../../ai/models";
import { aiServiceNameSchema } from "../../ai/types";
import type { createExecutionRunsRepository } from "../../db/repositories/execution-runs";
import type { createProjectsRepository } from "../../db/repositories/projects";
import type { createSubtasksRepository } from "../../db/repositories/subtasks";
import type { createTasksRepository } from "../../db/repositories/tasks";
import { publicProcedure, router } from "../../lib/trpc";
import { buildExecutionPrompt } from "./build-prompt";
import { ExecutionService } from "./service";

const serviceSchema = aiServiceNameSchema.default("claude");

const schemas = {
	runAll: z.object({
		taskId: z.string().uuid(),
		modelKey: modelKeySchema,
		service: serviceSchema,
	}),
	runSingle: z.object({
		taskId: z.string().uuid(),
		subtaskId: z.string().uuid(),
		modelKey: modelKeySchema,
		service: serviceSchema,
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
	executionRunsRepo: ReturnType<typeof createExecutionRunsRepository>;
};

export function createExecutionRouter(deps: Deps) {
	const serviceDeps = {
		...deps,
		buildPrompt: buildExecutionPrompt,
	};

	return router({
		runAll: publicProcedure.input(schemas.runAll).mutation(({ input }) => {
			ExecutionService.runAll(
				input.taskId,
				serviceDeps,
				input.modelKey,
				input.service,
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
					input.modelKey,
					input.service,
				);
				return { started: true };
			}),

		stop: publicProcedure.input(schemas.stop).mutation(async ({ input }) => {
			await ExecutionService.stop(input.taskId, serviceDeps);
			return { stopped: true };
		}),

		getStatus: publicProcedure
			.input(schemas.getStatus)
			.query(({ input }) =>
				ExecutionService.getStatus(input.taskId, serviceDeps),
			),
	});
}
