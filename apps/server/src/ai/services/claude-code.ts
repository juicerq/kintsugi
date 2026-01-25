import {
	unstable_v2_createSession,
	unstable_v2_resumeSession,
} from "@anthropic-ai/claude-agent-sdk";
import type { Kysely } from "kysely";
import { db as defaultDb } from "../../db";
import { createAiMessagesRepository } from "../../db/repositories/ai-messages";
import { createAiSessionsRepository } from "../../db/repositories/ai-sessions";
import type { Database } from "../../db/types";
import { BaseAiClient } from "../core";
import type {
	AiMessage,
	AiRole,
	AiSession,
	AiSessionScope,
	AiSessionStatus,
	CreateSessionInput,
	GetMessagesInput,
	ListSessionsInput,
	SendMessageInput,
} from "../types";

type ClaudeCodeTextBlock = {
	type: "text";
	text: string;
};

type ClaudeCodeSdkMessage = {
	type: string;
	session_id?: string;
	message?: {
		role?: AiRole;
		content: ClaudeCodeTextBlock[];
	};
};

type ClaudeCodeSessionHandle = {
	id?: string;
	sessionId?: string;
	session_id?: string;
	send(message: string): Promise<void>;
	stream(): AsyncGenerator<ClaudeCodeSdkMessage>;
	close(): void;
};

export type ClaudeCodeClientConfig = {
	model?: string;
	db?: Kysely<Database>;
	createSession?: (input: { model: string }) => ClaudeCodeSessionHandle;
	resumeSession?: (
		sessionId: string,
		input: { model: string },
	) => ClaudeCodeSessionHandle;
};

class SessionControlError extends Error {
	constructor(readonly reason: "paused" | "stopped") {
		super(`Session ${reason}`);
		this.name = "SessionControlError";
	}
}

export class ClaudeCodeClient extends BaseAiClient {
	readonly service = "claude" as const;
	private sessionsRepo: ReturnType<typeof createAiSessionsRepository>;
	private messagesRepo: ReturnType<typeof createAiMessagesRepository>;
	private sessionCache = new Map<string, ClaudeCodeSessionHandle>();
	private createSessionHandler: (input: {
		model: string;
	}) => ClaudeCodeSessionHandle;
	private resumeSessionHandler: (
		sessionId: string,
		input: { model: string },
	) => ClaudeCodeSessionHandle;

	constructor(private config: ClaudeCodeClientConfig) {
		super();
		const db = config.db ?? defaultDb;
		this.sessionsRepo = createAiSessionsRepository(db);
		this.messagesRepo = createAiMessagesRepository(db);
		this.createSessionHandler =
			config.createSession ?? unstable_v2_createSession;
		this.resumeSessionHandler =
			config.resumeSession ?? unstable_v2_resumeSession;
	}

	async createSession(input: CreateSessionInput): Promise<AiSession> {
		const metadata = this.mergeMetadata(input.scope, input.metadata);
		const model = input.model ?? this.config.model;
		if (!model) {
			throw new Error("Claude Code model not configured");
		}

		const session = this.createSessionHandler({ model });

		// SDK v2 only exposes session_id after first stream(), so we send an init message
		await session.send(".");
		let sessionId: string | null = null;
		for await (const message of session.stream()) {
			if (message.session_id) {
				sessionId = message.session_id;
				break;
			}
		}

		if (!sessionId) {
			throw new Error("Claude Code session ID not available");
		}

		this.sessionCache.set(sessionId, session);

		const created = await this.sessionsRepo.create({
			id: sessionId,
			service: this.service,
			title: input.title ?? null,
			model,
			scope_project_id: input.scope?.projectId ?? null,
			scope_repo_path: input.scope?.repoPath ?? null,
			scope_workspace_id: input.scope?.workspaceId ?? null,
			scope_label: input.scope?.label ?? null,
			metadata: this.serializeMetadata(metadata),
			status: "idle",
			stop_requested: 0,
		});

		return this.convertToLocalSession(created, input.scope);
	}

	async listSessions(input?: ListSessionsInput): Promise<AiSession[]> {
		const metadata = this.mergeMetadata(input?.scope, input?.metadata);

		const rows = await this.sessionsRepo.list({
			service: this.service,
			scope: this.scopeToColumns(input?.scope),
			limit: input?.limit,
		});

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
		const session = this.sessionCache.get(sessionId);

		if (!session) {
			return;
		}

		session.close();

		this.sessionCache.delete(sessionId);

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
		await this.ensureSessionRunnable(input.sessionId);
		const session = await this.getOrResumeSession(input.sessionId);
		const metadata = this.serializeMetadata(input.metadata);
		const userMessageId = crypto.randomUUID();
		const now = this.now();

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
			metadata,
		});

		try {
			await session.send(input.content);

			const sessionId = input.sessionId;
			const assistantChunks: string[] = [];
			const assistantRaw: ClaudeCodeSdkMessage[] = [];
			let assistantRole: AiRole = "assistant";

			for await (const message of session.stream()) {
				await this.refreshHeartbeat(sessionId);

				const controlReason = await this.checkControl(sessionId);

				if (controlReason) {
					await this.sessionsRepo.updateStatus(sessionId, {
						status: controlReason,
						last_heartbeat_at: this.now(),
					});

					this.closeCachedSession(sessionId);

					throw new SessionControlError(controlReason);
				}

				if (message.type !== "assistant" || !message.message) {
					continue;
				}

				assistantRaw.push(message);
				assistantRole = message.message.role ?? "assistant";
				assistantChunks.push(...this.extractText(message.message.content));
			}

			const content = assistantChunks.join("");
			const assistantMessageId = crypto.randomUUID();

			const saved = await this.messagesRepo.create({
				id: assistantMessageId,
				session_id: sessionId,
				role: assistantRole,
				content,
				metadata: null,
				raw: assistantRaw.length ? JSON.stringify(assistantRaw) : null,
			});

			await this.sessionsRepo.updateStatus(sessionId, {
				status: "idle",
				last_heartbeat_at: this.now(),
			});

			return this.convertToLocalMessage(saved);
		} catch (error) {
			if (error instanceof SessionControlError) {
				throw error;
			}

			await this.sessionsRepo.updateStatus(input.sessionId, {
				status: "failed",
				last_error: error instanceof Error ? error.message : String(error),
				last_heartbeat_at: this.now(),
			});

			throw error;
		}
	}

	async requestStop(sessionId: string): Promise<void> {
		await this.sessionsRepo.updateStatus(sessionId, {
			stop_requested: 1,
			status: "stopped",
			last_heartbeat_at: this.now(),
		});

		this.closeCachedSession(sessionId);
	}

	async pauseSession(sessionId: string): Promise<void> {
		await this.sessionsRepo.updateStatus(sessionId, {
			stop_requested: 1,
			status: "paused",
			last_heartbeat_at: this.now(),
		});

		this.closeCachedSession(sessionId);
	}

	async resumeSession(sessionId: string): Promise<void> {
		await this.sessionsRepo.updateStatus(sessionId, {
			stop_requested: 0,
			status: "idle",
			last_error: null,
			last_heartbeat_at: this.now(),
		});
	}

	private async getOrResumeSession(
		sessionId: string,
	): Promise<ClaudeCodeSessionHandle> {
		const cached = this.sessionCache.get(sessionId);

		if (cached) {
			return cached;
		}

		const row = await this.sessionsRepo.findById(sessionId);

		const model = row?.model ?? this.config.model;

		if (!model) {
			throw new Error("Claude Code model not configured");
		}

		const resumed = this.resumeSessionHandler(sessionId, { model });

		this.sessionCache.set(sessionId, resumed);

		return resumed;
	}

	private closeCachedSession(sessionId: string) {
		const session = this.sessionCache.get(sessionId);

		if (!session) {
			return;
		}

		session.close();

		this.sessionCache.delete(sessionId);
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

	private async checkControl(
		sessionId: string,
	): Promise<"paused" | "stopped" | null> {
		const session = await this.sessionsRepo.findById(sessionId);

		if (!session) {
			return "stopped";
		}

		if (session.stop_requested) {
			return session.status === "paused" ? "paused" : "stopped";
		}

		if (session.status === "paused") {
			return "paused";
		}

		return null;
	}

	private async refreshHeartbeat(sessionId: string) {
		await this.sessionsRepo.updateStatus(sessionId, {
			last_heartbeat_at: this.now(),
		});
	}

	private now() {
		return new Date().toISOString();
	}

	private scopeToColumns(scope?: AiSessionScope) {
		if (!scope) {
			return undefined;
		}

		return {
			scope_project_id: scope.projectId,
			scope_repo_path: scope.repoPath,
			scope_workspace_id: scope.workspaceId,
			scope_label: scope.label,
		};
	}

	private serializeMetadata(metadata?: Record<string, string>): string | null {
		if (!metadata || Object.keys(metadata).length === 0) {
			return null;
		}

		const ordered: Record<string, string> = {};

		for (const key of Object.keys(metadata).sort()) {
			ordered[key] = metadata[key];
		}

		return JSON.stringify(ordered);
	}

	private parseMetadata(
		metadata: string | null,
	): Record<string, string> | undefined {
		if (!metadata) {
			return undefined;
		}

		try {
			const parsed = JSON.parse(metadata) as Record<string, string>;

			return Object.keys(parsed).length > 0 ? parsed : undefined;
		} catch {
			return undefined;
		}
	}

	private metadataMatches(
		metadata: string | null,
		filter: Record<string, string>,
	): boolean {
		const parsed = this.parseMetadata(metadata) ?? {};

		for (const [key, value] of Object.entries(filter)) {
			if (parsed[key] !== value) {
				return false;
			}
		}

		return true;
	}

	private extractText(blocks: ClaudeCodeTextBlock[]): string[] {
		return blocks
			.filter((block) => block.type === "text")
			.map((block) => block.text);
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
		const scope =
			this.scopeFromMetadata(this.parseMetadata(row.metadata)) ?? fallbackScope;

		const columnScope = this.scopeFromColumns(row);

		return {
			id: row.id,
			service: this.service,
			title: row.title ?? undefined,
			model: row.model ?? undefined,
			createdAt: row.created_at,
			scope: scope ?? columnScope,
			metadata: this.parseMetadata(row.metadata),
			status: (row.status ?? "idle") as AiSessionStatus,
			stopRequested: Boolean(row.stop_requested),
			lastHeartbeatAt: row.last_heartbeat_at ?? undefined,
			lastError: row.last_error ?? undefined,
			raw: row,
		};
	}

	private scopeFromColumns(row: {
		scope_project_id: string | null;
		scope_repo_path: string | null;
		scope_workspace_id: string | null;
		scope_label: string | null;
	}): AiSessionScope | undefined {
		const scope: AiSessionScope = {};

		let hasValue = false;

		if (row.scope_project_id) {
			scope.projectId = row.scope_project_id;
			hasValue = true;
		}

		if (row.scope_repo_path) {
			scope.repoPath = row.scope_repo_path;
			hasValue = true;
		}

		if (row.scope_workspace_id) {
			scope.workspaceId = row.scope_workspace_id;
			hasValue = true;
		}

		if (row.scope_label) {
			scope.label = row.scope_label;
			hasValue = true;
		}

		return hasValue ? scope : undefined;
	}

	private convertToLocalMessage(message: {
		id: string;
		role: string;
		content: string;
		created_at: string;
		metadata: string | null;
		raw: string | null;
	}): AiMessage {
		return {
			id: message.id,
			role: message.role as AiRole,
			content: message.content,
			createdAt: message.created_at,
			metadata: this.parseMetadata(message.metadata),
			raw: message.raw ? JSON.parse(message.raw) : undefined,
		};
	}
}
