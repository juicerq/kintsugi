import { beforeEach, describe, expect, test } from "bun:test";
import type { OpencodeClient } from "@opencode-ai/sdk";
import { AiCore } from "../ai/core";
import { modelsMap } from "../ai/models";
import { servicesMap } from "../ai/services";
import type { AiRole } from "../ai/types";
import { createTestDb } from "./helpers";

const MODEL = modelsMap["haiku-4.5"].claude;
const TEST_REPO_PATH = "/tmp/kintsugi-test";

type ClaudeCodeSdkMessage = {
	type: string;
	session_id?: string;
	message?: {
		role?: AiRole;
		content: { type: "text"; text: string }[];
	};
};

function createMockQueryFn() {
	let callCount = 0;
	return function mockQuery(input: {
		prompt: string;
		options?: { resume?: string };
	}): AsyncIterable<ClaudeCodeSdkMessage> {
		callCount++;
		const sessionId = input.options?.resume ?? `mock-session-${callCount}`;

		return {
			async *[Symbol.asyncIterator]() {
				yield { type: "init", session_id: sessionId };

				if (input.prompt !== ".") {
					yield {
						type: "assistant",
						session_id: sessionId,
						message: {
							role: "assistant" as AiRole,
							content: [{ type: "text" as const, text: "pong" }],
						},
					};
				}

				yield { type: "result", session_id: sessionId };
			},
		};
	};
}

function createMockOpenCodeClient() {
	return {
		session: {
			create: async () => ({ data: { id: "open-session" } }),
			get: async () => ({ data: null }),
			abort: async () => ({ data: true }),
			prompt: async () => ({
				data: {
					info: { id: "open-message" },
					parts: [{ type: "text", text: "ok" }],
				},
			}),
		},
	} as unknown as OpencodeClient;
}

function createOpenCodeConfig(db: Awaited<ReturnType<typeof createTestDb>>) {
	return {
		db,
		_testClient: createMockOpenCodeClient(),
	};
}

describe("AiCore", () => {
	let db: Awaited<ReturnType<typeof createTestDb>>;

	beforeEach(async () => {
		db = await createTestDb();
	});

	test("returns cached client", () => {
		const core = new AiCore(servicesMap, {
			claude: { model: MODEL, db, queryFn: createMockQueryFn() },
			opencode: createOpenCodeConfig(db),
		});

		const first = core.getClient("claude");
		const second = core.getClient("claude");

		expect(first).toBe(second);
	});

	test("creates claude session through core", async () => {
		const core = new AiCore(servicesMap, {
			claude: { model: MODEL, db, queryFn: createMockQueryFn() },
			opencode: createOpenCodeConfig(db),
		});

		const client = core.getClient("claude");

		const session = await client.createSession({
			title: "Generic",
			model: MODEL,
			scope: { projectId: "core-project", repoPath: TEST_REPO_PATH },
		});

		expect(session.id).toBeDefined();
		expect(session.title).toBe("Generic");
		expect(session.model).toBe(MODEL);
		expect(session.scope?.projectId).toBe("core-project");

		const stored = await db
			.selectFrom("ai_sessions")
			.selectAll()
			.where("id", "=", session.id)
			.executeTakeFirstOrThrow();

		expect(stored.model).toBe(MODEL);
	});

	test("sends message through core", async () => {
		const core = new AiCore(servicesMap, {
			claude: { model: MODEL, db, queryFn: createMockQueryFn() },
			opencode: createOpenCodeConfig(db),
		});

		const client = core.getClient("claude");
		const session = await client.createSession({
			model: MODEL,
			scope: { repoPath: TEST_REPO_PATH },
		});

		const response = await client.sendMessage({
			sessionId: session.id,
			role: "user",
			content: "Say only 'ping'",
		});

		expect(response.role).toBe("assistant");
		expect(response.content).toBeDefined();

		const messages = await db
			.selectFrom("ai_messages")
			.selectAll()
			.where("session_id", "=", session.id)
			.execute();

		expect(messages).toHaveLength(2);
	});
});
