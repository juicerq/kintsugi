import { z } from "zod";
import { publicProcedure } from "../../lib/trpc";

export const greetProcedure = publicProcedure
	.input(z.object({ name: z.string().min(1) }))
	.query(({ input }) => `Hello, ${input.name}!`);
