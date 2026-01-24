import { initTRPC } from "@trpc/server";
import type { Kysely } from "kysely";
import { z } from "zod";
import type { Database } from "./db/types";
import { db } from "./db";
import { createProjectsRepository } from "./db/repositories/projects";

const t = initTRPC.create();

export const router = t.router;
export const publicProcedure = t.procedure;

const schemas = {
  createProject: z.object({
    name: z.string().min(1),
    path: z.string().min(1),
  }),
} as const;

export function createAppRouter(database: Kysely<Database>) {
  const projectsRepo = createProjectsRepository(database);

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
  });
}

export const appRouter = createAppRouter(db);

export type AppRouter = typeof appRouter;
