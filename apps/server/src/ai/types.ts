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

export type OpenCodeMessage = {
	id: string;
	role: AiRole;
	content: string;
	createdAt?: string;
	metadata?: Record<string, string>;
};

export type OpenCodeSessionCreateInput = {
	title?: string;
	metadata?: Record<string, string>;
};

export type OpenCodeSessionListInput = {
	limit?: number;
	metadata?: Record<string, string>;
};

export type OpenCodeSessionGetInput = {
	sessionId: string;
};

export type OpenCodeSessionCloseInput = {
	sessionId: string;
};

export type OpenCodeMessageListInput = {
	sessionId: string;
	limit?: number;
};

export type OpenCodeMessageSendInput = {
	sessionId: string;
	role: AiRole;
	content: string;
	metadata?: Record<string, string>;
};

export type OpenCodeSdk = {
	sessions: {
		create(input: OpenCodeSessionCreateInput): Promise<OpenCodeSession>;
		list(input?: OpenCodeSessionListInput): Promise<OpenCodeSession[]>;
		get(input: OpenCodeSessionGetInput): Promise<OpenCodeSession | null>;
		close(input: OpenCodeSessionCloseInput): Promise<void>;
	};

	messages: {
		list(input: OpenCodeMessageListInput): Promise<OpenCodeMessage[]>;
		send(input: OpenCodeMessageSendInput): Promise<OpenCodeMessage>;
	};
};

export type OpenCodeClientConfig = {
	sdk: OpenCodeSdk;
};

export type AiServiceConfigMap = {
	claude: import("./services/claude-code").ClaudeCodeClientConfig;
	opencode: OpenCodeClientConfig;
};
