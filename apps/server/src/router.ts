import { initTRPC } from "@trpc/server";
import type { Kysely } from "kysely";
import { z } from "zod";
import type { Database } from "./db/types";
import { db } from "./db";
import { createProjectsRepository } from "./db/repositories/projects";
import { createTasksRepository } from "./db/repositories/tasks";

const t = initTRPC.create();

export const router = t.router;
export const publicProcedure = t.procedure;

const schemas = {
  createProject: z.object({
    name: z.string().min(1),
    path: z.string().min(1),
  }),
  listTasks: z.object({
    projectId: z.string().uuid(),
  }),
  createTask: z.object({
    projectId: z.string().uuid(),
    title: z.string().min(1),
  }),
  toggleTaskComplete: z.object({
    id: z.string().uuid(),
  }),
  deleteTask: z.object({
    id: z.string().uuid(),
  }),
} as const;

export function createAppRouter(database: Kysely<Database>) {
  const projectsRepo = createProjectsRepository(database);
  const tasksRepo = createTasksRepository(database);

  return router({
    greet: publicProcedure
      .input(z.object({ name: z.string().min(1) }))
      .query(({ input }) => {
        return `Hello, ${input.name}!`;
      }),

    projects: router({
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
    }),

    tasks: router({
      list: publicProcedure
        .input(schemas.listTasks)
        .query(({ input }) => tasksRepo.listByProjectWithSubtaskCounts(input.projectId)),

      create: publicProcedure
        .input(schemas.createTask)
        .mutation(({ input }) => {
          const id = crypto.randomUUID();
          return tasksRepo.create({
            id,
            project_id: input.projectId,
            title: input.title,
          });
        }),

      toggleComplete: publicProcedure
        .input(schemas.toggleTaskComplete)
        .mutation(({ input }) => tasksRepo.toggleComplete(input.id)),

      delete: publicProcedure
        .input(schemas.deleteTask)
        .mutation(({ input }) => tasksRepo.delete(input.id)),
    }),
  });
}

export const appRouter = createAppRouter(db);

export type AppRouter = typeof appRouter;
