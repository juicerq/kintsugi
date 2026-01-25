export type AiServiceName = "claude" | "opencode";

export type AiRole = "system" | "user" | "assistant" | "tool";

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
	createdAt?: string;
	scope?: AiSessionScope;
	metadata?: Record<string, string>;
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
}

export type ClaudeCodeSession = {
	id: string;
	title?: string;
	createdAt?: string;
	metadata?: Record<string, string>;
};

export type ClaudeCodeMessage = {
	id: string;
	role: AiRole;
	content: string;
	createdAt?: string;
	metadata?: Record<string, string>;
};

export type ClaudeCodeSessionCreateInput = {
	title?: string;
	metadata?: Record<string, string>;
};

export type ClaudeCodeSessionListInput = {
	limit?: number;
	metadata?: Record<string, string>;
};

export type ClaudeCodeSessionGetInput = {
	sessionId: string;
};

export type ClaudeCodeSessionCloseInput = {
	sessionId: string;
};

export type ClaudeCodeMessageListInput = {
	sessionId: string;
	limit?: number;
};

export type ClaudeCodeMessageSendInput = {
	sessionId: string;
	role: AiRole;
	content: string;
	metadata?: Record<string, string>;
};

export type ClaudeCodeSdk = {
	sessions: {
		create(input: ClaudeCodeSessionCreateInput): Promise<ClaudeCodeSession>;
		list(input?: ClaudeCodeSessionListInput): Promise<ClaudeCodeSession[]>;
		get(input: ClaudeCodeSessionGetInput): Promise<ClaudeCodeSession | null>;
		close(input: ClaudeCodeSessionCloseInput): Promise<void>;
	};
	messages: {
		list(input: ClaudeCodeMessageListInput): Promise<ClaudeCodeMessage[]>;
		send(input: ClaudeCodeMessageSendInput): Promise<ClaudeCodeMessage>;
	};
};

export type ClaudeCodeClientConfig = {
	sdk: ClaudeCodeSdk;
};

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
	claude: ClaudeCodeClientConfig;
	opencode: OpenCodeClientConfig;
};
