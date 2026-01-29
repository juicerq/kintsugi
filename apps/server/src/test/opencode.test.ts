import { beforeEach, describe, expect, test } from "bun:test";
import type { OpencodeClient } from "@opencode-ai/sdk";
import { modelsMap } from "../ai/models";
import { OpenCodeClient } from "../ai/services/opencode";
import { createTestDb } from "./helpers";

const MODEL = modelsMap["haiku-4.5"].opencode;

type MockSession = {
	create: Array<{ body?: { title?: string } }>;
	get: Array<{ path: { id: string } }>;
	abort: Array<{ path: { id: string } }>;
	prompt: Array<{
		path: { id: string };
		body: {
			parts: Array<{ type: string; text?: string }>;
			model?: { providerID: string; modelID: string };
		};
	}>;
};

function createMockClient(overrides?: {
	createResult?: { id: string; title?: string };
	promptResult?: { info: { id: string }; parts: Array<{ type: string; text?: string }> };
}) {
	let sessionCounter = 0;

	const calls: MockSession = {
		create: [],
		get: [],
		abort: [],
		prompt: [],
	};

	const client = {
		session: {
			create: async (input: { body?: { title?: string } }) => {
				calls.create.push(input);
				sessionCounter++;
				return {
					data: overrides?.createResult ?? { id: `sdk-session-${sessionCounter}`, title: input.body?.title },
				};
			},
			get: async (input: { path: { id: string } }) => {
				calls.get.push(input);
				return { data: null };
			},
			abort: async (input: { path: { id: string } }) => {
				calls.abort.push(input);
				return { data: true };
			},
			prompt: async (input: MockSession["prompt"][0]) => {
				calls.prompt.push(input);
				return {
					data: overrides?.promptResult ?? {
						info: { id: "msg-1" },
						parts: [{ type: "text", text: "reply" }],
					},
				};
			},
		},
	} as unknown as OpencodeClient;

	return { client, calls };
}

describe("OpenCodeClient", () => {
	let db: Awaited<ReturnType<typeof createTestDb>>;

	beforeEach(async () => {
		db = await createTestDb();
	});

	test("createSession persists to database", async () => {
		const { client: mockClient } = createMockClient();
		const opencode = new OpenCodeClient({ db, _testClient: mockClient });

		const session = await opencode.createSession({
			title: "Test Session",
			model: MODEL,
			scope: { projectId: "proj-1" },
		});

		expect(session.id).toBe("sdk-session-1");
		expect(session.title).toBe("Test Session");
		expect(session.scope?.projectId).toBe("proj-1");

		const stored = await db
			.selectFrom("ai_sessions")
			.where("id", "=", session.id)
			.selectAll()
			.executeTakeFirst();

		expect(stored).toBeDefined();
		expect(stored?.service).toBe("opencode");
		expect(stored?.model).toBe(MODEL);
		expect(stored?.scope_project_id).toBe("proj-1");
	});

	test("listSessions returns sessions from database", async () => {
		const { client: mockClient } = createMockClient();
		const opencode = new OpenCodeClient({ db, _testClient: mockClient });

		await opencode.createSession({
			title: "Session A",
			scope: { projectId: "proj-1" },
		});

		await opencode.createSession({
			title: "Session B",
			scope: { projectId: "proj-2" },
		});

		const all = await opencode.listSessions();

		expect(all).toHaveLength(2);

		const filtered = await opencode.listSessions({
			scope: { projectId: "proj-1" },
		});

		expect(filtered).toHaveLength(1);
		expect(filtered[0]?.title).toBe("Session A");
	});

	test("getSession returns session from database", async () => {
		const { client: mockClient } = createMockClient();
		const opencode = new OpenCodeClient({ db, _testClient: mockClient });

		const created = await opencode.createSession({ title: "My Session" });

		const session = await opencode.getSession(created.id);

		expect(session).toBeDefined();
		expect(session?.id).toBe(created.id);
		expect(session?.title).toBe("My Session");
	});

	test("sendMessage persists user and assistant messages", async () => {
		const { client: mockClient, calls } = createMockClient({
			promptResult: {
				info: { id: "assistant-msg" },
				parts: [{ type: "text", text: "Hello back!" }],
			},
		});
		const opencode = new OpenCodeClient({ db, _testClient: mockClient });

		const session = await opencode.createSession({ title: "Chat" });

		const response = await opencode.sendMessage({
			sessionId: session.id,
			role: "user",
			content: "Hello",
		});

		expect(response.role).toBe("assistant");
		expect(response.content).toBe("Hello back!");

		const messages = await db
			.selectFrom("ai_messages")
			.where("session_id", "=", session.id)
			.orderBy("created_at", "asc")
			.selectAll()
			.execute();

		expect(messages).toHaveLength(2);
		expect(messages[0]?.role).toBe("user");
		expect(messages[0]?.content).toBe("Hello");
		expect(messages[1]?.role).toBe("assistant");
		expect(messages[1]?.content).toBe("Hello back!");

		expect(calls.prompt).toHaveLength(1);
		expect(calls.prompt[0]?.body.parts).toEqual([{ type: "text", text: "Hello" }]);
	});

	test("sendMessage resolves model from session", async () => {
		const { client: mockClient, calls } = createMockClient();
		const opencode = new OpenCodeClient({ db, _testClient: mockClient });

		const session = await opencode.createSession({
			title: "Chat",
			model: "openai/gpt-5.2-codex",
		});

		await opencode.sendMessage({
			sessionId: session.id,
			role: "user",
			content: "Hi",
		});

		expect(calls.prompt[0]?.body.model).toEqual({
			providerID: "openai",
			modelID: "gpt-5.2-codex",
		});
	});

	test("sendMessage updates session status", async () => {
		const { client: mockClient } = createMockClient();
		const opencode = new OpenCodeClient({ db, _testClient: mockClient });

		const session = await opencode.createSession({ title: "Chat" });

		await opencode.sendMessage({
			sessionId: session.id,
			role: "user",
			content: "Hi",
		});

		const updated = await db
			.selectFrom("ai_sessions")
			.where("id", "=", session.id)
			.selectAll()
			.executeTakeFirst();

		expect(updated?.status).toBe("idle");
		expect(updated?.last_heartbeat_at).toBeDefined();
	});

	test("getMessages returns messages from database", async () => {
		const { client: mockClient } = createMockClient();
		const opencode = new OpenCodeClient({ db, _testClient: mockClient });

		const session = await opencode.createSession({ title: "Chat" });

		await opencode.sendMessage({
			sessionId: session.id,
			role: "user",
			content: "Hello",
		});

		const messages = await opencode.getMessages({ sessionId: session.id });

		expect(messages).toHaveLength(2);
		expect(messages[0]?.role).toBe("user");
		expect(messages[1]?.role).toBe("assistant");
	});

	test("closeSession aborts and updates status", async () => {
		const { client: mockClient, calls } = createMockClient();
		const opencode = new OpenCodeClient({ db, _testClient: mockClient });

		const session = await opencode.createSession({ title: "Chat" });

		await opencode.closeSession(session.id);

		expect(calls.abort).toHaveLength(1);
		expect(calls.abort[0]?.path.id).toBe(session.id);

		const updated = await db
			.selectFrom("ai_sessions")
			.where("id", "=", session.id)
			.selectAll()
			.executeTakeFirst();

		expect(updated?.status).toBe("stopped");
	});

	test("requestStop aborts and marks stop_requested", async () => {
		const { client: mockClient, calls } = createMockClient();
		const opencode = new OpenCodeClient({ db, _testClient: mockClient });

		const session = await opencode.createSession({ title: "Chat" });

		await opencode.requestStop(session.id);

		expect(calls.abort).toHaveLength(1);

		const updated = await db
			.selectFrom("ai_sessions")
			.where("id", "=", session.id)
			.selectAll()
			.executeTakeFirst();

		expect(updated?.status).toBe("stopped");
		expect(updated?.stop_requested).toBe(1);
	});

	test("pauseSession sends control prompt and updates status", async () => {
		const { client: mockClient, calls } = createMockClient();
		const opencode = new OpenCodeClient({ db, _testClient: mockClient });

		const session = await opencode.createSession({ title: "Chat" });

		await opencode.pauseSession(session.id);

		expect(calls.prompt).toHaveLength(1);
		expect(calls.prompt[0]?.body.parts).toEqual([
			{ type: "text", text: "Pare e retorne agora." },
		]);

		const updated = await db
			.selectFrom("ai_sessions")
			.where("id", "=", session.id)
			.selectAll()
			.executeTakeFirst();

		expect(updated?.status).toBe("paused");
		expect(updated?.stop_requested).toBe(1);
	});

	test("resumeSession clears stop_requested and sends control prompt", async () => {
		const { client: mockClient, calls } = createMockClient();
		const opencode = new OpenCodeClient({ db, _testClient: mockClient });

		const session = await opencode.createSession({ title: "Chat" });

		await opencode.pauseSession(session.id);
		await opencode.resumeSession(session.id);

		expect(calls.prompt).toHaveLength(2);
		expect(calls.prompt[1]?.body.parts).toEqual([
			{ type: "text", text: "Continue de onde estava." },
		]);

		const updated = await db
			.selectFrom("ai_sessions")
			.where("id", "=", session.id)
			.selectAll()
			.executeTakeFirst();

		expect(updated?.status).toBe("idle");
		expect(updated?.stop_requested).toBe(0);
	});

	test("sendMessage rejects non-user roles", async () => {
		const { client: mockClient } = createMockClient();
		const opencode = new OpenCodeClient({ db, _testClient: mockClient });

		const session = await opencode.createSession({ title: "Chat" });

		await expect(
			opencode.sendMessage({
				sessionId: session.id,
				role: "assistant",
				content: "Hi",
			}),
		).rejects.toThrow("OpenCode only supports user prompts");
	});

	test("sendMessage rejects when session is stopped", async () => {
		const { client: mockClient } = createMockClient();
		const opencode = new OpenCodeClient({ db, _testClient: mockClient });

		const session = await opencode.createSession({ title: "Chat" });

		await opencode.requestStop(session.id);

		await expect(
			opencode.sendMessage({
				sessionId: session.id,
				role: "user",
				content: "Hi",
			}),
		).rejects.toThrow("stopped");
	});
});
