import { initTRPC } from "@trpc/server";
import type { Kysely } from "kysely";
import { z } from "zod";
import type { Database } from "./db/types";
import { db } from "./db";
import { createProjectsRepository } from "./db/repositories/projects";
import { createTasksRepository } from "./db/repositories/tasks";
import { createSubtasksRepository } from "./db/repositories/subtasks";

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
  listSubtasks: z.object({
    taskId: z.string().uuid(),
  }),
  updateSubtask: z.object({
    id: z.string().uuid(),
    status: z.enum(["waiting", "in_progress", "completed"]).optional(),
    should_commit: z.boolean().optional(),
  }),
} as const;

export function createAppRouter(database: Kysely<Database>) {
  const projectsRepo = createProjectsRepository(database);
  const tasksRepo = createTasksRepository(database);
  const subtasksRepo = createSubtasksRepository(database);

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

      get: publicProcedure
        .input(schemas.getTask)
        .query(({ input }) => tasksRepo.findById(input.id)),

      create: publicProcedure
        .input(schemas.createTask)
        .mutation(({ input }) => {
          const id = crypto.randomUUID();
          return tasksRepo.create({
            id,
            project_id: input.projectId,
            title: input.title,
            description: input.description,
            branch_name: input.branchName,
          });
        }),

      update: publicProcedure
        .input(schemas.updateTask)
        .mutation(({ input }) => {
          const { id, ...data } = input;
          return tasksRepo.update(id, data);
        }),

      toggleComplete: publicProcedure
        .input(schemas.toggleTaskComplete)
        .mutation(({ input }) => tasksRepo.toggleComplete(input.id)),

      delete: publicProcedure
        .input(schemas.deleteTask)
        .mutation(({ input }) => tasksRepo.delete(input.id)),
    }),

    subtasks: router({
      list: publicProcedure
        .input(schemas.listSubtasks)
        .query(({ input }) => subtasksRepo.listByTask(input.taskId)),

      update: publicProcedure
        .input(schemas.updateSubtask)
        .mutation(({ input }) => {
          const { id, should_commit, ...rest } = input;
          return subtasksRepo.update(id, {
            ...rest,
            should_commit: should_commit !== undefined ? (should_commit ? 1 : 0) : undefined,
          });
        }),
    }),
  });
}

export const appRouter = createAppRouter(db);

export type AppRouter = typeof appRouter;
