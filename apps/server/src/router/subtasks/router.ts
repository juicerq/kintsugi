import { z } from "zod";
import type { createSubtasksRepository } from "../../db/repositories/subtasks";
import { uiEventBus } from "../../events/bus";
import { publicProcedure, router } from "../../lib/trpc";

const schemas = {
	listSubtasks: z.object({
		taskId: z.string().uuid(),
	}),
	getSubtask: z.object({
		id: z.string().uuid(),
	}),
	createSubtask: z.object({
		taskId: z.string().uuid(),
		name: z.string().min(1),
		acceptanceCriterias: z.array(z.string()).optional(),
		outOfScope: z.array(z.string()).optional(),
		steps: z.array(z.string()).optional(),
		category: z.enum(["code", "test", "docs", "fix", "refactor"]).optional(),
	}),
	createSubtasksBatch: z.object({
		taskId: z.string().uuid(),
		subtasks: z.array(
			z.object({
				name: z.string().min(1),
				acceptanceCriterias: z.array(z.string()).optional(),
				outOfScope: z.array(z.string()).optional(),
				steps: z.array(z.string()).optional(),
				category: z
					.enum(["code", "test", "docs", "fix", "refactor"])
					.optional(),
			}),
		),
	}),
	updateSubtask: z.object({
		id: z.string().uuid(),
		name: z.string().min(1).optional(),
		acceptanceCriterias: z.array(z.string()).nullable().optional(),
		outOfScope: z.array(z.string()).nullable().optional(),
		category: z
			.enum(["code", "test", "docs", "fix", "refactor"])
			.nullable()
			.optional(),
		status: z
			.enum(["waiting", "in_progress", "completed", "failed"])
			.optional(),
		error: z.string().nullable().optional(),
		shouldCommit: z.boolean().optional(),
		keyDecisions: z.array(z.string()).nullable().optional(),
		files: z.array(z.string()).nullable().optional(),
		steps: z.array(z.string()).nullable().optional(),
		notes: z.string().nullable().optional(),
		startedAt: z.string().nullable().optional(),
		finishedAt: z.string().nullable().optional(),
	}),
	deleteSubtask: z.object({
		id: z.string().uuid(),
	}),
} as const;

type SubtasksRepository = ReturnType<typeof createSubtasksRepository>;

export function createSubtasksRouter(subtasksRepo: SubtasksRepository) {
	return router({
		list: publicProcedure
			.input(schemas.listSubtasks)
			.query(({ input }) => subtasksRepo.listByTask(input.taskId)),

		get: publicProcedure
			.input(schemas.getSubtask)
			.query(({ input }) => subtasksRepo.findById(input.id)),

		create: publicProcedure
			.input(schemas.createSubtask)
			.mutation(({ input }) => {
				const id = crypto.randomUUID();
				return subtasksRepo.create({
					id,
					task_id: input.taskId,
					name: input.name,
					acceptance_criterias: input.acceptanceCriterias
						? JSON.stringify(input.acceptanceCriterias)
						: null,
					out_of_scope: input.outOfScope
						? JSON.stringify(input.outOfScope)
						: null,
					steps: input.steps ? JSON.stringify(input.steps) : null,
					category: input.category ?? null,
					status: "waiting",
					should_commit: 0,
					started_at: null,
					finished_at: null,
					key_decisions: null,
					files: null,
					notes: null,
					error: null,
				});
			}),

		createBatch: publicProcedure
			.input(schemas.createSubtasksBatch)
			.mutation(({ input }) => {
				const subtasks = input.subtasks.map((subtask) => ({
					id: crypto.randomUUID(),
					task_id: input.taskId,
					name: subtask.name,
					acceptance_criterias: subtask.acceptanceCriterias
						? JSON.stringify(subtask.acceptanceCriterias)
						: null,
					out_of_scope: subtask.outOfScope
						? JSON.stringify(subtask.outOfScope)
						: null,
					steps: subtask.steps ? JSON.stringify(subtask.steps) : null,
					category: subtask.category ?? null,
					status: "waiting" as const,
					should_commit: 0,
					started_at: null,
					finished_at: null,
					key_decisions: null,
					files: null,
					notes: null,
					error: null,
				}));
				return subtasksRepo.createMany(subtasks);
			}),

		update: publicProcedure
			.input(schemas.updateSubtask)
			.mutation(async ({ input }) => {
				const {
					id,
					acceptanceCriterias,
					outOfScope,
					steps,
					shouldCommit,
					keyDecisions,
					files,
					startedAt,
					finishedAt,
					...rest
				} = input;
				const updated = await subtasksRepo.update(id, {
					...rest,
					acceptance_criterias:
						acceptanceCriterias !== undefined
							? acceptanceCriterias
								? JSON.stringify(acceptanceCriterias)
								: null
							: undefined,
					out_of_scope:
						outOfScope !== undefined
							? outOfScope
								? JSON.stringify(outOfScope)
								: null
							: undefined,
					steps:
						steps !== undefined
							? steps
								? JSON.stringify(steps)
								: null
							: undefined,
					should_commit:
						shouldCommit !== undefined ? (shouldCommit ? 1 : 0) : undefined,
					key_decisions:
						keyDecisions !== undefined
							? keyDecisions
								? JSON.stringify(keyDecisions)
								: null
							: undefined,
					files:
						files !== undefined
							? files
								? JSON.stringify(files)
								: null
							: undefined,
					started_at: startedAt !== undefined ? startedAt : undefined,
					finished_at: finishedAt !== undefined ? finishedAt : undefined,
				});
				if (!updated) {
					return updated;
				}
				uiEventBus.publish({
					type: "subtask.updated",
					subtaskId: updated.id,
					taskId: updated.task_id,
				});
				return updated;
			}),

		delete: publicProcedure
			.input(schemas.deleteSubtask)
			.mutation(({ input }) => subtasksRepo.delete(input.id)),
	});
}
