import { initTRPC } from "@trpc/server";
import { logger, truncate } from "./logger";

const t = initTRPC.create();

const loggedProcedure = t.procedure.use(async (opts) => {
  const result = await opts.next();

  if (!result.ok) {
    const rootError = result.error.cause instanceof Error
      ? result.error.cause
      : result.error;
    logger.error("tRPC error", rootError, {
      procedure: opts.path,
      code: result.error.code,
      inputPreview: truncate(JSON.stringify(opts.input), 200),
    });
  }

  return result;
});

export const router = t.router;
export const publicProcedure = loggedProcedure;
