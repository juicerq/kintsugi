import { BaseAiClient } from "../core";
import type {
	AiMessage,
	AiSession,
	AiSessionScope,
	CreateSessionInput,
	GetMessagesInput,
	ListSessionsInput,
	OpenCodeClientConfig,
	OpenCodeMessage,
	OpenCodeSession,
	SendMessageInput,
} from "../types";

export class OpenCodeClient extends BaseAiClient {
	readonly service = "opencode" as const;

	constructor(private config: OpenCodeClientConfig) {
		super();
	}

	async createSession(input: CreateSessionInput): Promise<AiSession> {
		const mergedMetadata = this.mergeMetadata(input.scope, input.metadata);

		const metadata = input.model
			? {
					...(mergedMetadata ?? {}),
					"kintsugi.model": input.model,
				}
			: mergedMetadata;

		const session = await this.config.sdk.session.create({
			body: {
				title: input.title,
				metadata,
			},
		});

		return this.convertToLocalSession(session, input.scope);
	}

	async listSessions(input?: ListSessionsInput): Promise<AiSession[]> {
		const metadata = this.mergeMetadata(input?.scope, input?.metadata);

		const sessions = await this.config.sdk.session.list(
			input?.limit ? { query: { limit: input.limit } } : undefined,
		);

		const filtered = metadata
			? sessions.filter((session) =>
					this.metadataMatches(session.metadata, metadata),
				)
			: sessions;

		const limited = input?.limit ? filtered.slice(0, input.limit) : filtered;

		return limited.map((session) => this.convertToLocalSession(session));
	}

	async getSession(sessionId: string): Promise<AiSession | null> {
		const session = await this.config.sdk.session.get({
			path: { id: sessionId },
		});

		return session ? this.convertToLocalSession(session) : null;
	}

	async closeSession(sessionId: string): Promise<void> {
		await this.config.sdk.session.abort({ path: { id: sessionId } });
	}

	async getMessages(input: GetMessagesInput): Promise<AiMessage[]> {
		const messages = await this.config.sdk.session.messages({
			path: { id: input.sessionId },
		});

		const limited = input.limit ? messages.slice(0, input.limit) : messages;

		return limited.map((message) => this.convertToLocalMessage(message));
	}

	async sendMessage(input: SendMessageInput): Promise<AiMessage> {
		if (input.role !== "user") {
			throw new Error("OpenCode only supports user prompts");
		}

		const model = await this.resolveModel(input.sessionId);

		const message = await this.config.sdk.session.prompt({
			path: { id: input.sessionId },
			body: {
				parts: [{ type: "text", text: input.content }],
				model,
			},
		});

		return this.convertToLocalMessage(message);
	}

	async requestStop(sessionId: string): Promise<void> {
		await this.config.sdk.session.abort({ path: { id: sessionId } });
	}

	async pauseSession(sessionId: string): Promise<void> {
		await this.sendControlPrompt(sessionId, "Pare e retorne agora.");
	}

	async resumeSession(sessionId: string): Promise<void> {
		await this.sendControlPrompt(sessionId, "Continue de onde estava.");
	}

	private convertToLocalSession(
		session: OpenCodeSession,
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

	private convertToLocalMessage(message: OpenCodeMessage): AiMessage {
		const content = this.extractText(message.parts).join("");
		return {
			id: message.info.id,
			role: message.info.role,
			content,
			createdAt: message.info.createdAt,
			metadata: message.info.metadata,
			raw: message,
		};
	}

	private metadataMatches(
		metadata: Record<string, string> | undefined,
		filter: Record<string, string>,
	): boolean {
		if (!metadata) {
			return false;
		}

		for (const [key, value] of Object.entries(filter)) {
			if (metadata[key] !== value) {
				return false;
			}
		}

		return true;
	}

	private extractText(parts: OpenCodeMessage["parts"]): string[] {
		return parts
			.filter((part) => part.type === "text")
			.map((part) => String(part.text ?? ""));
	}

	private async resolveModel(
		sessionId: string,
	): Promise<{ providerID: string; modelID: string } | undefined> {
		const session = await this.config.sdk.session.get({
			path: { id: sessionId },
		});

		const model = session?.metadata?.["kintsugi.model"];

		if (!model) {
			return undefined;
		}

		const [providerID, ...rest] = model.split("/");

		if (!providerID || rest.length === 0) {
			return undefined;
		}

		return {
			providerID,
			modelID: rest.join("/"),
		};
	}

	private async sendControlPrompt(
		sessionId: string,
		content: string,
	): Promise<void> {
		const model = await this.resolveModel(sessionId);

		await this.config.sdk.session.prompt({
			path: { id: sessionId },
			body: {
				parts: [{ type: "text", text: content }],
				model,
			},
		});
	}
}
