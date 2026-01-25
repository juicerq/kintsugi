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
  getSubtask: z.object({
    id: z.string().uuid(),
  }),
  createSubtask: z.object({
    taskId: z.string().uuid(),
    name: z.string().min(1),
    acceptanceCriterias: z.array(z.string()).optional(),
    outOfScope: z.array(z.string()).optional(),
    category: z.enum(["code", "test", "docs", "fix", "refactor"]).optional(),
  }),
  createSubtasksBatch: z.object({
    taskId: z.string().uuid(),
    subtasks: z.array(z.object({
      name: z.string().min(1),
      acceptanceCriterias: z.array(z.string()).optional(),
      outOfScope: z.array(z.string()).optional(),
      category: z.enum(["code", "test", "docs", "fix", "refactor"]).optional(),
    })),
  }),
  updateSubtask: z.object({
    id: z.string().uuid(),
    name: z.string().min(1).optional(),
    acceptanceCriterias: z.array(z.string()).nullable().optional(),
    outOfScope: z.array(z.string()).nullable().optional(),
    category: z.enum(["code", "test", "docs", "fix", "refactor"]).nullable().optional(),
    status: z.enum(["waiting", "in_progress", "completed"]).optional(),
    shouldCommit: z.boolean().optional(),
    keyDecisions: z.array(z.string()).nullable().optional(),
    files: z.array(z.string()).nullable().optional(),
    notes: z.string().nullable().optional(),
    startedAt: z.string().nullable().optional(),
    finishedAt: z.string().nullable().optional(),
  }),
  deleteSubtask: z.object({
    id: z.string().uuid(),
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
            acceptance_criterias: input.acceptanceCriterias ? JSON.stringify(input.acceptanceCriterias) : null,
            out_of_scope: input.outOfScope ? JSON.stringify(input.outOfScope) : null,
            category: input.category ?? null,
            status: "waiting",
            should_commit: 0,
            started_at: null,
            finished_at: null,
            key_decisions: null,
            files: null,
            notes: null,
          });
        }),

      createBatch: publicProcedure
        .input(schemas.createSubtasksBatch)
        .mutation(({ input }) => {
          const subtasks = input.subtasks.map((s) => ({
            id: crypto.randomUUID(),
            task_id: input.taskId,
            name: s.name,
            acceptance_criterias: s.acceptanceCriterias ? JSON.stringify(s.acceptanceCriterias) : null,
            out_of_scope: s.outOfScope ? JSON.stringify(s.outOfScope) : null,
            category: s.category ?? null,
            status: "waiting" as const,
            should_commit: 0,
            started_at: null,
            finished_at: null,
            key_decisions: null,
            files: null,
            notes: null,
          }));
          return subtasksRepo.createMany(subtasks);
        }),

      update: publicProcedure
        .input(schemas.updateSubtask)
        .mutation(({ input }) => {
          const { id, acceptanceCriterias, outOfScope, shouldCommit, keyDecisions, files, startedAt, finishedAt, ...rest } = input;
          return subtasksRepo.update(id, {
            ...rest,
            acceptance_criterias: acceptanceCriterias !== undefined
              ? (acceptanceCriterias ? JSON.stringify(acceptanceCriterias) : null)
              : undefined,
            out_of_scope: outOfScope !== undefined
              ? (outOfScope ? JSON.stringify(outOfScope) : null)
              : undefined,
            should_commit: shouldCommit !== undefined ? (shouldCommit ? 1 : 0) : undefined,
            key_decisions: keyDecisions !== undefined
              ? (keyDecisions ? JSON.stringify(keyDecisions) : null)
              : undefined,
            files: files !== undefined
              ? (files ? JSON.stringify(files) : null)
              : undefined,
            started_at: startedAt !== undefined ? startedAt : undefined,
            finished_at: finishedAt !== undefined ? finishedAt : undefined,
          });
        }),

      delete: publicProcedure
        .input(schemas.deleteSubtask)
        .mutation(({ input }) => subtasksRepo.delete(input.id)),
    }),
  });
}

export const appRouter = createAppRouter(db);

export type AppRouter = typeof appRouter;
