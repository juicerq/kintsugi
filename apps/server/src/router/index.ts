import type { Kysely } from "kysely";
import { db } from "../db";
import { createExecutionRunsRepository } from "../db/repositories/execution-runs";
import { createProjectsRepository } from "../db/repositories/projects";
import { createSubtasksRepository } from "../db/repositories/subtasks";
import { createTasksRepository } from "../db/repositories/tasks";
import type { Database } from "../db/types";
import { createExecutionRouter } from "../features/execution/router";
import { router } from "../lib/trpc";
import { aiRouter } from "./ai/router";
import { eventsRouter } from "./events/router";
import { createGitRouter } from "./git/router";
import { greetProcedure } from "./greet/procedure";
import { createProjectsRouter } from "./projects/router";
import { createSubtasksRouter } from "./subtasks/router";
import { createTasksRouter } from "./tasks/router";

export function createAppRouter(database: Kysely<Database>) {
	const projectsRepo = createProjectsRepository(database);
	const tasksRepo = createTasksRepository(database);
	const subtasksRepo = createSubtasksRepository(database);
	const executionRunsRepo = createExecutionRunsRepository(database);

	return router({
		greet: greetProcedure,
		projects: createProjectsRouter(projectsRepo),
		tasks: createTasksRouter(tasksRepo),
		subtasks: createSubtasksRouter(subtasksRepo),
		execution: createExecutionRouter({
			subtasksRepo,
			tasksRepo,
			projectsRepo,
			executionRunsRepo,
		}),
		git: createGitRouter(projectsRepo),
		ai: aiRouter,
		events: eventsRouter,
	});
}

export const appRouter = createAppRouter(db);

export type AppRouter = typeof appRouter;
