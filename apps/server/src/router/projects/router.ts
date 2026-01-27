import { z } from "zod";
import type { createProjectsRepository } from "../../db/repositories/projects";
import { publicProcedure, router } from "../../lib/trpc";

const schemas = {
	createProject: z.object({
		name: z.string().min(1),
		path: z.string().min(1),
	}),
} as const;

type ProjectsRepository = ReturnType<typeof createProjectsRepository>;

export function createProjectsRouter(projectsRepo: ProjectsRepository) {
	return router({
		list: publicProcedure.query(() => projectsRepo.list()),

		create: publicProcedure
			.input(schemas.createProject)
			.mutation(({ input }) => {
				const id = crypto.randomUUID();
				return projectsRepo.create({
					id,
					name: input.name,
					path: input.path,
				});
			}),
	});
}
