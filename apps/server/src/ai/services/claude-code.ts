import { BaseAiClient } from "../core";
import type {
	AiMessage,
	AiSession,
	AiSessionScope,
	ClaudeCodeClientConfig,
	ClaudeCodeMessage,
	ClaudeCodeSession,
	CreateSessionInput,
	GetMessagesInput,
	ListSessionsInput,
	SendMessageInput,
} from "../types";

export class ClaudeCodeClient extends BaseAiClient {
	readonly service = "claude" as const;

	constructor(private config: ClaudeCodeClientConfig) {
		super();
	}

	async createSession(input: CreateSessionInput): Promise<AiSession> {
		const metadata = this.mergeMetadata(input.scope, input.metadata);

		const session = await this.config.sdk.sessions.create({
			title: input.title,
			metadata,
		});

		return this.toAiSession(session, input.scope);
	}

	async listSessions(input?: ListSessionsInput): Promise<AiSession[]> {
		const metadata = this.mergeMetadata(input?.scope, input?.metadata);

		const sessions = await this.config.sdk.sessions.list({
			limit: input?.limit,
			metadata,
		});

		return sessions.map((session) => this.toAiSession(session));
	}

	async getSession(sessionId: string): Promise<AiSession | null> {
		const session = await this.config.sdk.sessions.get({ sessionId });

		return session ? this.toAiSession(session) : null;
	}

	async closeSession(sessionId: string): Promise<void> {
		return await this.config.sdk.sessions.close({ sessionId });
	}

	async getMessages(input: GetMessagesInput): Promise<AiMessage[]> {
		const messages = await this.config.sdk.messages.list({
			sessionId: input.sessionId,
			limit: input.limit,
		});

		return messages.map((message) => this.toAiMessage(message));
	}

	async sendMessage(input: SendMessageInput): Promise<AiMessage> {
		const message = await this.config.sdk.messages.send({
			sessionId: input.sessionId,
			role: input.role,
			content: input.content,
			metadata: input.metadata,
		});
		return this.toAiMessage(message);
	}

	private toAiSession(
		session: ClaudeCodeSession,
		fallbackScope?: AiSessionScope,
	): AiSession {
		const scope = this.scopeFromMetadata(session.metadata) ?? fallbackScope;

		return {
			id: session.id,
			service: this.service,
			title: session.title,
			createdAt: session.createdAt,
			scope,
			metadata: session.metadata,
			raw: session,
		};
	}

	private toAiMessage(message: ClaudeCodeMessage): AiMessage {
		return {
			id: message.id,
			role: message.role,
			content: message.content,
			createdAt: message.createdAt,
			metadata: message.metadata,
			raw: message,
		};
	}
}
