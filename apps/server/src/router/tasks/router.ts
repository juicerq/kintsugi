import { z } from "zod";
import type { createTasksRepository } from "../../db/repositories/tasks";
import { publicProcedure, router } from "../../lib/trpc";

const schemas = {
	listTasks: z.object({
		projectId: z.string().uuid(),
	}),
	createTask: z.object({
		projectId: z.string().uuid(),
		title: z.string().min(1),
		description: z.string().optional(),
		branchName: z.string().optional(),
	}),
	toggleTaskComplete: z.object({
		id: z.string().uuid(),
	}),
	deleteTask: z.object({
		id: z.string().uuid(),
	}),
	getTask: z.object({
		id: z.string().uuid(),
	}),
	updateTask: z.object({
		id: z.string().uuid(),
		brainstorm: z.string().nullable().optional(),
		architecture: z.string().nullable().optional(),
		review: z.string().nullable().optional(),
	}),
} as const;

type TasksRepository = ReturnType<typeof createTasksRepository>;

export function createTasksRouter(tasksRepo: TasksRepository) {
	return router({
		list: publicProcedure
			.input(schemas.listTasks)
			.query(({ input }) =>
				tasksRepo.listByProjectWithSubtaskCounts(input.projectId),
			),

		get: publicProcedure
			.input(schemas.getTask)
			.query(({ input }) => tasksRepo.findById(input.id)),

		create: publicProcedure.input(schemas.createTask).mutation(({ input }) => {
			const id = crypto.randomUUID();
			return tasksRepo.create({
				id,
				project_id: input.projectId,
				title: input.title,
				description: input.description,
				branch_name: input.branchName,
			});
		}),

		update: publicProcedure.input(schemas.updateTask).mutation(({ input }) => {
			const { id, ...data } = input;

			return tasksRepo.update(id, data);
		}),

		toggleComplete: publicProcedure
			.input(schemas.toggleTaskComplete)
			.mutation(({ input }) => tasksRepo.toggleComplete(input.id)),

		delete: publicProcedure
			.input(schemas.deleteTask)
			.mutation(({ input }) => tasksRepo.delete(input.id)),
	});
}
