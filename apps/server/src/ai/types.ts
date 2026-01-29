import type { Kysely } from "kysely";
import type { Database } from "../db/types";
import type { ClaudeCodeClientConfig } from "./services/claude-code";

export type AiServiceName = "claude" | "opencode";

export type AiRole = "system" | "user" | "assistant" | "tool";

export type AiSessionStatus =
	| "idle"
	| "running"
	| "paused"
	| "stopped"
	| "failed"
	| "completed";

export type AiSessionScope = {
	projectId?: string;
	repoPath?: string;
	workspaceId?: string;
	label?: string;
};

export type AiSession = {
	id: string;
	service: AiServiceName;
	title?: string;
	model?: string;
	createdAt?: string;
	scope?: AiSessionScope;
	metadata?: Record<string, string>;
	status?: AiSessionStatus;
	stopRequested?: boolean;
	lastHeartbeatAt?: string;
	lastError?: string;
	raw?: unknown;
};

export type AiMessage = {
	id: string;
	role: AiRole;
	content: string;
	createdAt?: string;
	metadata?: Record<string, string>;
	raw?: unknown;
};

export type PermissionMode = "default" | "acceptEdits" | "dontAsk" | "plan";

export type CreateSessionInput = {
	title?: string;
	model?: string;
	scope?: AiSessionScope;
	metadata?: Record<string, string>;
	allowedTools?: string[];
	permissionMode?: PermissionMode;
};

export type ListSessionsInput = {
	scope?: AiSessionScope;
	metadata?: Record<string, string>;
	limit?: number;
};

export type GetMessagesInput = {
	sessionId: string;
	limit?: number;
};

export type SendMessageInput = {
	sessionId: string;
	role: AiRole;
	content: string;
	metadata?: Record<string, string>;
};

export interface AiClient {
	readonly service: AiServiceName;

	createSession(input: CreateSessionInput): Promise<AiSession>;

	listSessions(input?: ListSessionsInput): Promise<AiSession[]>;

	getSession(sessionId: string): Promise<AiSession | null>;

	closeSession(sessionId: string): Promise<void>;

	getMessages(input: GetMessagesInput): Promise<AiMessage[]>;

	sendMessage(input: SendMessageInput): Promise<AiMessage>;

	requestStop(sessionId: string): Promise<void>;

	pauseSession(sessionId: string): Promise<void>;

	resumeSession(sessionId: string): Promise<void>;
}

export type OpenCodeClientConfig = {
	db?: Kysely<Database>;
	hostname?: string;
	port?: number;
	timeout?: number;
	_testClient?: unknown;
};

export type AiServiceConfigMap = {
	claude: ClaudeCodeClientConfig;
	opencode: OpenCodeClientConfig;
};
