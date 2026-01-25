import type { AppRouter } from "@kintsugi/server/src/router";
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";

export type { AppRouter };
export type RouterInputs = inferRouterInputs<AppRouter>;
export type RouterOutputs = inferRouterOutputs<AppRouter>;
