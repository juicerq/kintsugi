import {
	createOpencode,
	type OpencodeClient,
	type Part,
} from "@opencode-ai/sdk";
import { db as defaultDb } from "../../db";
import { createAiMessagesRepository } from "../../db/repositories/ai-messages";
import { createAiSessionsRepository } from "../../db/repositories/ai-sessions";
import { uiEventBus } from "../../events/bus";
import { logger, truncate } from "../../lib/logger";
import { withErrorLog } from "../../lib/safe";
import { BaseAiClient, SessionControlError } from "../core";
import type {
	AiMessage,
	AiSession,
	AiSessionScope,
	AiSessionStatus,
	CreateSessionInput,
	GetMessagesInput,
	ListSessionsInput,
	OpenCodeClientConfig,
	SendMessageInput,
} from "../types";

type OpenCodeInstance = {
	client: OpencodeClient;
	server: { url: string; close(): void };
};

export class OpenCodeClient extends BaseAiClient {
	readonly service = "opencode" as const;

	private instance: OpenCodeInstance | null = null;
	private instancePromise: Promise<OpenCodeInstance> | null = null;
	private sessionsRepo: ReturnType<typeof createAiSessionsRepository>;
	private messagesRepo: ReturnType<typeof createAiMessagesRepository>;

	constructor(private config: OpenCodeClientConfig) {
		super();
		const db = config.db ?? defaultDb;
		this.sessionsRepo = createAiSessionsRepository(db);
		this.messagesRepo = createAiMessagesRepository(db);
	}

	private async ensureClient(): Promise<OpencodeClient> {
		if (this.config._testClient) {
			return this.config._testClient as OpencodeClient;
		}

		if (this.instance) {
			return this.instance.client;
		}

		if (this.instancePromise) {
			const instance = await this.instancePromise;
			return instance.client;
		}

		this.instancePromise = createOpencode({
			hostname: this.config.hostname ?? "127.0.0.1",
			port: this.config.port ?? 4096,
			timeout: this.config.timeout ?? 10000,
		});

		this.instance = await this.instancePromise;
		this.instancePromise = null;

		return this.instance.client;
	}

	async createSession(input: CreateSessionInput): Promise<AiSession> {
		return withErrorLog(
			async () => {
				const client = await this.ensureClient();

				const sdkSession = await client.session.create({
					body: { title: input.title },
				});

				const session = this.unwrap(sdkSession);

				const created = await this.sessionsRepo.create({
					id: session.id,
					service: this.service,
					title: session.title ?? input.title ?? null,
					model: input.model ?? null,
					scope_project_id: input.scope?.projectId ?? null,
					scope_repo_path: input.scope?.repoPath ?? null,
					scope_workspace_id: input.scope?.workspaceId ?? null,
					scope_label: input.scope?.label ?? null,
					metadata: this.serializeMetadata(
						this.mergeMetadata(input.scope, input.metadata),
					),
					status: "idle",
					stop_requested: 0,
				});

				logger.info("Session created", {
					sessionId: created.id,
					service: this.service,
					model: input.model,
					scope: {
						projectId: input.scope?.projectId,
						repoPath: input.scope?.repoPath,
					},
				});

				return this.convertToLocalSession(created, input.scope);
			},
			(error) =>
				logger.error("Session creation failed", error, {
					service: this.service,
					model: input.model,
					scope: {
						projectId: input.scope?.projectId,
						repoPath: input.scope?.repoPath,
					},
				}),
		);
	}

	async listSessions(input?: ListSessionsInput): Promise<AiSession[]> {
		const rows = await this.sessionsRepo.list({
			service: this.service,
			scope: this.scopeToColumns(input?.scope),
			limit: input?.limit,
		});

		const metadata = this.mergeMetadata(input?.scope, input?.metadata);

		const filtered = metadata
			? rows.filter((row) => this.metadataMatches(row.metadata, metadata))
			: rows;

		return filtered.map((row) => this.convertToLocalSession(row));
	}

	async getSession(sessionId: string): Promise<AiSession | null> {
		const row = await this.sessionsRepo.findById(sessionId);

		return row ? this.convertToLocalSession(row) : null;
	}

	async closeSession(sessionId: string): Promise<void> {
		const client = await this.ensureClient();

		await client.session.abort({ path: { id: sessionId } });

		await this.sessionsRepo.updateStatus(sessionId, {
			status: "stopped",
			last_heartbeat_at: this.now(),
		});
	}

	async getMessages(input: GetMessagesInput): Promise<AiMessage[]> {
		const messages = await this.messagesRepo.listBySession(
			input.sessionId,
			input.limit,
		);

		return messages.map((message) => this.convertToLocalMessage(message));
	}

	async sendMessage(input: SendMessageInput): Promise<AiMessage> {
		const sessionLog = logger.forSession(input.sessionId);

		sessionLog.info("Message sending", {
			role: input.role,
			contentPreview: truncate(input.content),
		});

		if (input.role !== "user") {
			throw new Error("OpenCode only supports user prompts");
		}

		await this.ensureSessionRunnable(input.sessionId);

		const client = await this.ensureClient();

		const now = this.now();
		const userMessageId = crypto.randomUUID();

		await this.sessionsRepo.updateStatus(input.sessionId, {
			status: "running",
			last_heartbeat_at: now,
			last_error: null,
		});

		await this.messagesRepo.create({
			id: userMessageId,
			session_id: input.sessionId,
			role: input.role,
			content: input.content,
			metadata: this.serializeMetadata(input.metadata),
		});

		return withErrorLog(
			async () => {
				const model = await this.resolveModel(input.sessionId);

				const response = await client.session.prompt({
					path: { id: input.sessionId },
					body: {
						parts: [{ type: "text", text: input.content }],
						model,
					},
				});

				const message = this.unwrap(response);

				const content = this.extractText(message.parts);
				const assistantMessageId = crypto.randomUUID();

				const saved = await this.messagesRepo.create({
					id: assistantMessageId,
					session_id: input.sessionId,
					role: "assistant",
					content,
					metadata: null,
					raw: JSON.stringify(message),
				});

				await this.sessionsRepo.updateStatus(input.sessionId, {
					status: "idle",
					last_heartbeat_at: this.now(),
				});

				const messageCount = await this.messagesRepo.countBySession(
					input.sessionId,
				);

				uiEventBus.publish({
					type: "session.newMessage",
					sessionId: input.sessionId,
					messageCount,
				});

				sessionLog.info("Message received", {
					role: "assistant",
					contentPreview: truncate(content),
				});

				return this.convertToLocalMessage(saved);
			},
			async (error) => {
				sessionLog.error("Session failed", error);

				await this.sessionsRepo.updateStatus(input.sessionId, {
					status: "failed",
					last_error: error.message,
					last_heartbeat_at: this.now(),
				});
			},
		);
	}

	async requestStop(sessionId: string): Promise<void> {
		const client = await this.ensureClient();

		await client.session.abort({ path: { id: sessionId } });

		await this.sessionsRepo.updateStatus(sessionId, {
			stop_requested: 1,
			status: "stopped",
			last_heartbeat_at: this.now(),
		});

		uiEventBus.publish({
			type: "session.stopped",
			sessionId,
			reason: "user",
		});
	}

	async pauseSession(sessionId: string): Promise<void> {
		await this.sendControlPrompt(sessionId, "Pare e retorne agora.");

		await this.sessionsRepo.updateStatus(sessionId, {
			stop_requested: 1,
			status: "paused",
			last_heartbeat_at: this.now(),
		});
	}

	async resumeSession(sessionId: string): Promise<void> {
		await this.sessionsRepo.updateStatus(sessionId, {
			stop_requested: 0,
			status: "idle",
			last_error: null,
			last_heartbeat_at: this.now(),
		});

		await this.sendControlPrompt(sessionId, "Continue de onde estava.");
	}

	private async sendControlPrompt(
		sessionId: string,
		content: string,
	): Promise<void> {
		const client = await this.ensureClient();
		const model = await this.resolveModel(sessionId);

		await client.session.prompt({
			path: { id: sessionId },
			body: {
				parts: [{ type: "text", text: content }],
				model,
			},
		});
	}

	private async ensureSessionRunnable(sessionId: string): Promise<void> {
		const session = await this.sessionsRepo.findById(sessionId);

		if (!session) {
			throw new Error("Session not found");
		}

		const status = session.status ?? "idle";

		if (session.stop_requested) {
			throw new SessionControlError(status === "paused" ? "paused" : "stopped");
		}

		if (status === "paused") {
			throw new SessionControlError("paused");
		}

		if (status === "stopped") {
			throw new SessionControlError("stopped");
		}

		if (status === "failed") {
			throw new Error("Session failed");
		}
	}

	private async resolveModel(
		sessionId: string,
	): Promise<{ providerID: string; modelID: string } | undefined> {
		const session = await this.sessionsRepo.findById(sessionId);

		const model = session?.model;

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

	private extractText(parts: Part[]): string {
		return parts
			.filter(
				(part): part is Part & { type: "text"; text: string } =>
					part.type === "text" && "text" in part,
			)
			.map((part) => part.text)
			.join("");
	}

	private unwrap<T>(result: { data?: T; error?: unknown }): T {
		if (result.error) {
			throw new Error(
				typeof result.error === "object" && result.error !== null
					? JSON.stringify(result.error)
					: String(result.error),
			);
		}

		if (!result.data) {
			throw new Error("No data returned from OpenCode SDK");
		}

		return result.data;
	}

	private convertToLocalSession(
		row: {
			id: string;
			service: string;
			title: string | null;
			model: string | null;
			created_at: string;
			scope_project_id: string | null;
			scope_repo_path: string | null;
			scope_workspace_id: string | null;
			scope_label: string | null;
			metadata: string | null;
			status: string | null;
			stop_requested: number;
			last_heartbeat_at: string | null;
			last_error: string | null;
		},
		fallbackScope?: AiSessionScope,
	): AiSession {
		const metadataScope = this.scopeFromMetadata(
			this.parseMetadata(row.metadata),
		);

		const columnScope = this.scopeFromColumns(row);

		const scope = this.mergeScopes(columnScope, metadataScope, fallbackScope);

		return {
			id: row.id,
			service: this.service,
			title: row.title ?? undefined,
			model: row.model ?? undefined,
			createdAt: row.created_at,
			scope,
			metadata: this.parseMetadata(row.metadata),
			status: (row.status ?? "idle") as AiSessionStatus,
			stopRequested: Boolean(row.stop_requested),
			lastHeartbeatAt: row.last_heartbeat_at ?? undefined,
			lastError: row.last_error ?? undefined,
			raw: row,
		};
	}
}
