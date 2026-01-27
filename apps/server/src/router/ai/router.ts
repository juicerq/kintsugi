import { z } from "zod";
import { modelKeys } from "../../ai/models";
import { AiService } from "../../ai/service";
import { publicProcedure, router } from "../../lib/trpc";

const serviceSchema = z.enum(["claude", "opencode"]);
const modelKeySchema = z.enum(modelKeys as [string, ...string[]]);

const scopeSchema = z.object({
	projectId: z.string().uuid(),
	repoPath: z.string().optional(),
	workspaceId: z.string().optional(),
	label: z.string().optional(),
});

const metadataSchema = z.record(z.string()).optional();

const schemas = {
	createSession: z.object({
		service: serviceSchema,
		modelKey: modelKeySchema,
		title: z.string().optional(),
		scope: scopeSchema,
		metadata: metadataSchema,
	}),
	listSessions: z.object({
		service: serviceSchema,
		scope: scopeSchema,
		limit: z.number().int().positive().optional(),
	}),
	getSession: z.object({
		service: serviceSchema,
		sessionId: z.string(),
	}),
	closeSession: z.object({
		service: serviceSchema,
		sessionId: z.string(),
	}),
	pauseSession: z.object({
		service: serviceSchema,
		sessionId: z.string(),
	}),
	resumeSession: z.object({
		service: serviceSchema,
		sessionId: z.string(),
	}),
	stopSession: z.object({
		service: serviceSchema,
		sessionId: z.string(),
	}),
	getMessages: z.object({
		service: serviceSchema,
		sessionId: z.string(),
		limit: z.number().int().positive().optional(),
	}),
	sendMessage: z.object({
		service: serviceSchema,
		sessionId: z.string(),
		content: z.string().min(1),
		metadata: metadataSchema,
	}),
} as const;

const sessionsRouter = router({
	create: publicProcedure.input(schemas.createSession).mutation(({ input }) =>
		AiService.createSession({
			service: input.service,
			modelKey: input.modelKey as Parameters<
				typeof AiService.createSession
			>[0]["modelKey"],
			title: input.title,
			scope: input.scope,
			metadata: input.metadata,
		}),
	),

	list: publicProcedure.input(schemas.listSessions).query(({ input }) =>
		AiService.listSessions({
			service: input.service,
			scope: input.scope,
			limit: input.limit,
		}),
	),

	get: publicProcedure.input(schemas.getSession).query(({ input }) =>
		AiService.getSession({
			service: input.service,
			sessionId: input.sessionId,
		}),
	),

	close: publicProcedure.input(schemas.closeSession).mutation(({ input }) =>
		AiService.closeSession({
			service: input.service,
			sessionId: input.sessionId,
		}),
	),

	pause: publicProcedure.input(schemas.pauseSession).mutation(({ input }) =>
		AiService.pauseSession({
			service: input.service,
			sessionId: input.sessionId,
		}),
	),

	resume: publicProcedure.input(schemas.resumeSession).mutation(({ input }) =>
		AiService.resumeSession({
			service: input.service,
			sessionId: input.sessionId,
		}),
	),

	stop: publicProcedure.input(schemas.stopSession).mutation(({ input }) =>
		AiService.stopSession({
			service: input.service,
			sessionId: input.sessionId,
		}),
	),
});

const messagesRouter = router({
	list: publicProcedure.input(schemas.getMessages).query(({ input }) =>
		AiService.getMessages({
			service: input.service,
			sessionId: input.sessionId,
			limit: input.limit,
		}),
	),

	send: publicProcedure.input(schemas.sendMessage).mutation(({ input }) =>
		AiService.sendMessage({
			service: input.service,
			sessionId: input.sessionId,
			content: input.content,
			metadata: input.metadata,
		}),
	),
});

export const aiRouter = router({
	sessions: sessionsRouter,
	messages: messagesRouter,
});
