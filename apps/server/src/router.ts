import { initTRPC } from "@trpc/server";
import type { Kysely } from "kysely";
import { z } from "zod";
import type { Database } from "./db/types";
import { db } from "./db";

const t = initTRPC.create();

export const router = t.router;
export const publicProcedure = t.procedure;

export function createAppRouter(_db: Kysely<Database>) {
  return router({
    greet: publicProcedure
      .input(z.object({ name: z.string().min(1) }))
      .query(({ input }) => {
        return `Hello, ${input.name}!`;
      }),
  });
}

export const appRouter = createAppRouter(db);

export type AppRouter = typeof appRouter;
