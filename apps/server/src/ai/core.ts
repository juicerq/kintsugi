import type {
	AiClient,
	AiMessage,
	AiRole,
	AiServiceConfigMap,
	AiServiceName,
	AiSession,
	AiSessionScope,
	CreateSessionInput,
	GetMessagesInput,
	ListSessionsInput,
	SendMessageInput,
} from "./types";

type DbMessageRow = {
	id: string;
	role: string;
	content: string;
	created_at: string;
	metadata: string | null;
	raw: string | null;
};

type DbSessionScopeColumns = {
	scope_project_id: string | null;
	scope_repo_path: string | null;
	scope_workspace_id: string | null;
	scope_label: string | null;
};

export class SessionControlError extends Error {
	constructor(readonly reason: "paused" | "stopped") {
		super(`Session ${reason}`);
		this.name = "SessionControlError";
	}
}

const scopeKeyMap = {
	projectId: "kintsugi.scope.project_id",
	repoPath: "kintsugi.scope.repo_path",
	workspaceId: "kintsugi.scope.workspace_id",
	label: "kintsugi.scope.label",
} as const;

type ScopeKey = keyof AiSessionScope;

export abstract class BaseAiClient implements AiClient {
	abstract readonly service: AiServiceName;
	abstract createSession(input: CreateSessionInput): Promise<AiSession>;
	abstract listSessions(input?: ListSessionsInput): Promise<AiSession[]>;
	abstract getSession(sessionId: string): Promise<AiSession | null>;
	abstract closeSession(sessionId: string): Promise<void>;
	abstract getMessages(input: GetMessagesInput): Promise<AiMessage[]>;
	abstract sendMessage(input: SendMessageInput): Promise<AiMessage>;
	abstract requestStop(sessionId: string): Promise<void>;
	abstract pauseSession(sessionId: string): Promise<void>;
	abstract resumeSession(sessionId: string): Promise<void>;

	protected mergeMetadata(
		scope: AiSessionScope | undefined,
		metadata: Record<string, string> | undefined,
	): Record<string, string> | undefined {
		if (!scope && !metadata) {
			return undefined;
		}

		const merged: Record<string, string> = metadata ? { ...metadata } : {};

		if (scope) {
			for (const key of Object.keys(scopeKeyMap) as ScopeKey[]) {
				const value = scope[key];

				if (value !== undefined) {
					merged[scopeKeyMap[key]] = String(value);
				}
			}
		}

		return merged;
	}

	protected scopeFromMetadata(
		metadata: Record<string, string> | undefined,
	): AiSessionScope | undefined {
		if (!metadata) {
			return undefined;
		}

		const scope: AiSessionScope = {};

		let hasValue = false;

		for (const key of Object.keys(scopeKeyMap) as ScopeKey[]) {
			const value = metadata[scopeKeyMap[key]];

			if (value !== undefined) {
				scope[key] = value;
				hasValue = true;
			}
		}

		return hasValue ? scope : undefined;
	}

	protected now(): string {
		return new Date().toISOString();
	}

	protected serializeMetadata(
		metadata?: Record<string, string>,
	): string | null {
		if (!metadata || Object.keys(metadata).length === 0) {
			return null;
		}

		const ordered: Record<string, string> = {};

		for (const key of Object.keys(metadata).sort()) {
			ordered[key] = metadata[key];
		}

		return JSON.stringify(ordered);
	}

	protected parseMetadata(
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

	protected metadataMatches(
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

	protected scopeToColumns(scope?: AiSessionScope) {
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

	protected scopeFromColumns(
		row: DbSessionScopeColumns,
	): AiSessionScope | undefined {
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

	protected mergeScopes(
		...scopes: (AiSessionScope | undefined)[]
	): AiSessionScope | undefined {
		const merged: AiSessionScope = {};
		let hasValue = false;

		for (const scope of scopes) {
			if (!scope) continue;

			if (scope.projectId && !merged.projectId) {
				merged.projectId = scope.projectId;
				hasValue = true;
			}
			if (scope.repoPath && !merged.repoPath) {
				merged.repoPath = scope.repoPath;
				hasValue = true;
			}
			if (scope.workspaceId && !merged.workspaceId) {
				merged.workspaceId = scope.workspaceId;
				hasValue = true;
			}
			if (scope.label && !merged.label) {
				merged.label = scope.label;
				hasValue = true;
			}
		}

		return hasValue ? merged : undefined;
	}

	protected convertToLocalMessage(message: DbMessageRow): AiMessage {
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

export type AiServiceRegistry = {
	[K in AiServiceName]: new (
		config: AiServiceConfigMap[K],
	) => AiClient;
};

export class AiCore {
	private clients = new Map<AiServiceName, AiClient>();

	constructor(
		private registry: AiServiceRegistry,
		private config: AiServiceConfigMap,
	) {}

	getClient<T extends AiServiceName>(
		service: T,
	): InstanceType<AiServiceRegistry[T]> {
		const existing = this.clients.get(service);

		if (existing) {
			return existing as InstanceType<AiServiceRegistry[T]>;
		}

		const Client = this.registry[service];

		const client = new Client(this.config[service]) as InstanceType<
			AiServiceRegistry[T]
		>;

		this.clients.set(service, client);

		return client;
	}
}
