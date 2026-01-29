import { TRPCError } from "@trpc/server";
import { z } from "zod";
import type { createProjectsRepository } from "../../db/repositories/projects";
import {
	checkoutBranch,
	getCurrentBranch,
} from "../../features/git/operations";
import { publicProcedure, router } from "../../lib/trpc";

const schemas = {
	currentBranch: z.object({
		projectId: z.string().uuid(),
	}),
	checkout: z.object({
		projectId: z.string().uuid(),
		branchName: z.string().min(1),
	}),
} as const;

type ProjectsRepository = ReturnType<typeof createProjectsRepository>;

export function createGitRouter(projectsRepo: ProjectsRepository) {
	return router({
		currentBranch: publicProcedure
			.input(schemas.currentBranch)
			.query(async ({ input }) => {
				const project = await projectsRepo.findById(input.projectId);
				if (!project) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: `Project not found: ${input.projectId}`,
					});
				}
				const branch = await getCurrentBranch(project.path);
				return { branch };
			}),

		checkout: publicProcedure
			.input(schemas.checkout)
			.mutation(async ({ input }) => {
				const project = await projectsRepo.findById(input.projectId);
				if (!project) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: `Project not found: ${input.projectId}`,
					});
				}
				const branch = await checkoutBranch(project.path, input.branchName);
				return { success: true as const, branch };
			}),
	});
}
