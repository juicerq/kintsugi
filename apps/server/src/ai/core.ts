import type {
	AiClient,
	AiMessage,
	AiServiceConfigMap,
	AiServiceName,
	AiSession,
	AiSessionScope,
	CreateSessionInput,
	GetMessagesInput,
	ListSessionsInput,
	SendMessageInput,
} from "./types";

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
