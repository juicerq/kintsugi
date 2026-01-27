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

export type CreateSessionInput = {
	title?: string;
	model?: string;
	scope?: AiSessionScope;
	metadata?: Record<string, string>;
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

export type OpenCodeSession = {
	id: string;
	title?: string;
	createdAt?: string;
	metadata?: Record<string, string>;
};

export type OpenCodePart = {
	type: string;
} & Record<string, unknown>;

export type OpenCodeMessageInfo = {
	id: string;
	role: AiRole;
	createdAt?: string;
	metadata?: Record<string, string>;
};

export type OpenCodeMessage = {
	info: OpenCodeMessageInfo;
	parts: OpenCodePart[];
};

export type OpenCodeSessionCreateInput = {
	body: {
		title?: string;
		metadata?: Record<string, string>;
	};
};

export type OpenCodeSessionListInput = {
	query?: {
		limit?: number;
	};
};

export type OpenCodeSessionGetInput = {
	path: {
		id: string;
	};
};

export type OpenCodeSessionAbortInput = {
	path: {
		id: string;
	};
};

export type OpenCodeSessionMessagesInput = {
	path: {
		id: string;
	};
};

export type OpenCodeSessionPromptInput = {
	path: {
		id: string;
	};
	body: {
		parts: OpenCodePart[];
		model?: {
			providerID: string;
			modelID: string;
		};
		noReply?: boolean;
	};
};

export type OpenCodeSdk = {
	session: {
		create(input: OpenCodeSessionCreateInput): Promise<OpenCodeSession>;
		list(input?: OpenCodeSessionListInput): Promise<OpenCodeSession[]>;
		get(input: OpenCodeSessionGetInput): Promise<OpenCodeSession | null>;
		abort(input: OpenCodeSessionAbortInput): Promise<boolean>;
		messages(input: OpenCodeSessionMessagesInput): Promise<OpenCodeMessage[]>;
		prompt(input: OpenCodeSessionPromptInput): Promise<OpenCodeMessage>;
	};
};

export type OpenCodeClientConfig = {
	sdk: OpenCodeSdk;
};

export type AiServiceConfigMap = {
	claude: ClaudeCodeClientConfig;
	opencode: OpenCodeClientConfig;
};
