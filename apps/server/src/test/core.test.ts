import { beforeEach, describe, expect, test } from "bun:test";
import { AiCore } from "../ai/core";
import { servicesMap } from "../ai/services";
import { createTestDb } from "./helpers";

const MODEL = "claude-3-5-haiku-20241022";

function createOpenCodeConfig() {
	return {
		sdk: {
			session: {
				create: async () => ({ id: "open-session" }),
				list: async () => [],
				get: async () => null,
				abort: async () => true,
				messages: async () => [],
				prompt: async () => ({
					info: {
						id: "open-message",
						role: "assistant" as const,
					},
					parts: [{ type: "text", text: "ok" }],
				}),
			},
		},
	};
}

describe("AiCore", () => {
	let db: Awaited<ReturnType<typeof createTestDb>>;

	beforeEach(async () => {
		db = await createTestDb();
	});

	test("returns cached client", () => {
		const core = new AiCore(servicesMap, {
			claude: { model: MODEL, db },
			opencode: createOpenCodeConfig(),
		});

		const first = core.getClient("claude");
		const second = core.getClient("claude");

		expect(first).toBe(second);
	});

	test(
		"creates claude session through core",
		async () => {
			const core = new AiCore(servicesMap, {
				claude: { model: MODEL, db },
				opencode: createOpenCodeConfig(),
			});

			const client = core.getClient("claude");

			const session = await client.createSession({
				title: "Generic",
				model: MODEL,
				scope: { projectId: "core-project" },
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
		},
		{ timeout: 30000 },
	);

	test(
		"sends message through core",
		async () => {
			const core = new AiCore(servicesMap, {
				claude: { model: MODEL, db },
				opencode: createOpenCodeConfig(),
			});

			const client = core.getClient("claude");
			const session = await client.createSession({ model: MODEL });

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
		},
		{ timeout: 30000 },
	);
});
