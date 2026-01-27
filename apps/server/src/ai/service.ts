import { TRPCError } from "@trpc/server";
import { type ModelKey, modelsMap } from "../ai/models";
import { servicesMap } from "../ai/services";
import type {
	AiServiceName,
	AiSessionScope,
	PermissionMode,
} from "../ai/types";
import { db } from "../db";
import { AiCore } from "./core";

const DEFAULT_ALLOWED_TOOLS = [
	"Bash",
	"Read",
	"Glob",
	"Grep",
	"LS",
];

const aiCore = new AiCore(servicesMap, {
	claude: {
		db,
		allowedTools: DEFAULT_ALLOWED_TOOLS,
		permissionMode: "dontAsk",
	},
	opencode: {
		sdk: {
			session: {
				create: () => Promise.reject(new Error("OpenCode SDK not configured")),
				list: () => Promise.reject(new Error("OpenCode SDK not configured")),
				get: () => Promise.reject(new Error("OpenCode SDK not configured")),
				abort: () => Promise.reject(new Error("OpenCode SDK not configured")),
				messages: () =>
					Promise.reject(new Error("OpenCode SDK not configured")),
				prompt: () => Promise.reject(new Error("OpenCode SDK not configured")),
			},
		},
	},
});

function resolveModelId(modelKey: ModelKey, service: AiServiceName): string {
	const entry = modelsMap[modelKey];

	if (!entry) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: `Invalid model key: ${modelKey}`,
		});
	}

	const modelId = entry[service];

	if (!modelId) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: `Model "${modelKey}" not available for service "${service}"`,
		});
	}

	return modelId;
}

type CreateSessionParams = {
	service: AiServiceName;
	modelKey: ModelKey;
	title?: string;
	scope: AiSessionScope & { projectId: string };
	metadata?: Record<string, string>;
	allowedTools?: string[];
	permissionMode?: PermissionMode;
};

type ListSessionsParams = {
	service: AiServiceName;
	scope: AiSessionScope & { projectId: string };
	limit?: number;
};

type GetSessionParams = {
	service: AiServiceName;
	sessionId: string;
};

type CloseSessionParams = {
	service: AiServiceName;
	sessionId: string;
};

type PauseSessionParams = {
	service: AiServiceName;
	sessionId: string;
};

type ResumeSessionParams = {
	service: AiServiceName;
	sessionId: string;
};

type StopSessionParams = {
	service: AiServiceName;
	sessionId: string;
};

type GetMessagesParams = {
	service: AiServiceName;
	sessionId: string;
	limit?: number;
};

type SendMessageParams = {
	service: AiServiceName;
	sessionId: string;
	content: string;
	metadata?: Record<string, string>;
};

export namespace AiService {
	export function createSession(params: CreateSessionParams) {
		const modelId = resolveModelId(params.modelKey, params.service);

		const client = aiCore.getClient(params.service);

		return client.createSession({
			title: params.title,
			model: modelId,
			scope: params.scope,
			metadata: params.metadata,
			allowedTools: params.allowedTools,
			permissionMode: params.permissionMode,
		});
	}

	export function listSessions(params: ListSessionsParams) {
		const client = aiCore.getClient(params.service);

		return client.listSessions({
			scope: params.scope,
			limit: params.limit,
		});
	}

	export async function getSession(params: GetSessionParams) {
		const client = aiCore.getClient(params.service);

		const session = await client.getSession(params.sessionId);

		if (!session) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: `Session ${params.sessionId} not found`,
			});
		}

		return session;
	}

	export function closeSession(params: CloseSessionParams) {
		const client = aiCore.getClient(params.service);

		return client.closeSession(params.sessionId);
	}

	export function pauseSession(params: PauseSessionParams) {
		const client = aiCore.getClient(params.service);

		return client.pauseSession(params.sessionId);
	}

	export function resumeSession(params: ResumeSessionParams) {
		const client = aiCore.getClient(params.service);

		return client.resumeSession(params.sessionId);
	}

	export function stopSession(params: StopSessionParams) {
		const client = aiCore.getClient(params.service);

		return client.requestStop(params.sessionId);
	}

	export function getMessages(params: GetMessagesParams) {
		const client = aiCore.getClient(params.service);

		return client.getMessages({
			sessionId: params.sessionId,
			limit: params.limit,
		});
	}

	export function sendMessage(params: SendMessageParams) {
		const client = aiCore.getClient(params.service);

		return client.sendMessage({
			sessionId: params.sessionId,
			role: "user",
			content: params.content,
			metadata: params.metadata,
		});
	}
}
