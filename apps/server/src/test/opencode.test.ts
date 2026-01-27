import { beforeEach, describe, expect, test } from "bun:test";
import { OpenCodeClient } from "../ai/services/opencode";
import type {
	OpenCodeSdk,
	OpenCodeSessionAbortInput,
	OpenCodeSessionCreateInput,
	OpenCodeSessionGetInput,
	OpenCodeSessionListInput,
	OpenCodeSessionMessagesInput,
	OpenCodeSessionPromptInput,
} from "../ai/types";

type OpenCodeCalls = {
	create: OpenCodeSessionCreateInput[];
	list: OpenCodeSessionListInput[];
	get: OpenCodeSessionGetInput[];
	abort: OpenCodeSessionAbortInput[];
	messages: OpenCodeSessionMessagesInput[];
	prompt: OpenCodeSessionPromptInput[];
};

function createSdk(overrides?: Partial<OpenCodeSdk>) {
	const calls: OpenCodeCalls = {
		create: [],
		list: [],
		get: [],
		abort: [],
		messages: [],
		prompt: [],
	};

	const sdk: OpenCodeSdk = {
		session: {
			create: async (input) => {
				calls.create.push(input);
				return { id: "session-1", metadata: input.body.metadata };
			},
			list: async (input) => {
				if (input) {
					calls.list.push(input);
				}
				return [];
			},
			get: async (input) => {
				calls.get.push(input);
				return null;
			},
			abort: async (input) => {
				calls.abort.push(input);
				return true;
			},
			messages: async (input) => {
				calls.messages.push(input);
				return [];
			},
			prompt: async (input) => {
				calls.prompt.push(input);
				return {
					info: { id: "message-1", role: "assistant" },
					parts: [{ type: "text", text: "ok" }],
				};
			},
		},
	};

	return {
		calls,
		sdk: overrides
			? {
					session: {
						...sdk.session,
						...overrides.session,
					},
				}
			: sdk,
	};
}

describe("OpenCodeClient", () => {
	let client: OpenCodeClient;
	let calls: OpenCodeCalls;

	beforeEach(() => {
		const setup = createSdk();
		calls = setup.calls;
		client = new OpenCodeClient({ sdk: setup.sdk });
	});

	test("createSession merges metadata and scope", async () => {
		const session = await client.createSession({
			title: "Session",
			scope: { projectId: "project-1" },
			metadata: { owner: "kintsugi" },
		});

		expect(calls.create).toHaveLength(1);
		expect(calls.create[0]?.body.title).toBe("Session");
		expect(calls.create[0]?.body.metadata).toEqual({
			"kintsugi.scope.project_id": "project-1",
			owner: "kintsugi",
		});
		expect(session.scope?.projectId).toBe("project-1");
		expect(session.metadata?.owner).toBe("kintsugi");
	});

	test("listSessions filters by metadata", async () => {
		const setup = createSdk({
			session: {
				list: async (input) => {
					if (input) {
						calls.list.push(input);
					}
					return [
						{
							id: "a",
							metadata: {
								"kintsugi.scope.project_id": "project-a",
							},
						},
						{
							id: "b",
							metadata: {
								"kintsugi.scope.project_id": "project-b",
							},
						},
					];
				},
			},
		});
		client = new OpenCodeClient({ sdk: setup.sdk });

		const sessions = await client.listSessions({
			scope: { projectId: "project-a" },
			limit: 10,
		});

		expect(calls.list).toHaveLength(1);
		expect(calls.list[0]?.query?.limit).toBe(10);
		expect(sessions).toHaveLength(1);
		expect(sessions[0]?.id).toBe("a");
	});

	test("getMessages converts parts to content", async () => {
		const setup = createSdk({
			session: {
				messages: async (input) => {
					calls.messages.push(input);
					return [
						{
							info: { id: "m1", role: "assistant" },
							parts: [{ type: "text", text: "hello" }],
						},
						{
							info: { id: "m2", role: "assistant" },
							parts: [
								{ type: "text", text: "ping" },
								{ type: "text", text: "pong" },
							],
						},
					];
				},
			},
		});
		client = new OpenCodeClient({ sdk: setup.sdk });

		const messages = await client.getMessages({ sessionId: "session-1" });

		expect(calls.messages).toHaveLength(1);
		expect(messages[0]?.content).toBe("hello");
		expect(messages[1]?.content).toBe("pingpong");
	});

	test("sendMessage uses prompt and returns assistant content", async () => {
		const setup = createSdk({
			session: {
				prompt: async (input) => {
					calls.prompt.push(input);
					return {
						info: { id: "m1", role: "assistant" },
						parts: [{ type: "text", text: "reply" }],
					};
				},
			},
		});
		client = new OpenCodeClient({ sdk: setup.sdk });

		const response = await client.sendMessage({
			sessionId: "session-1",
			role: "user",
			content: "hello",
		});

		expect(calls.prompt).toHaveLength(1);
		expect(calls.prompt[0]?.body.parts).toEqual([
			{ type: "text", text: "hello" },
		]);
		expect(response.content).toBe("reply");
	});

	test("sendMessage includes model from session metadata", async () => {
		const setup = createSdk({
			session: {
				get: async (input) => {
					calls.get.push(input);
					return {
						id: "session-1",
						metadata: { "kintsugi.model": "openai/gpt-5.2-codex" },
					};
				},
				prompt: async (input) => {
					calls.prompt.push(input);
					return {
						info: { id: "m1", role: "assistant" },
						parts: [{ type: "text", text: "reply" }],
					};
				},
			},
		});
		client = new OpenCodeClient({ sdk: setup.sdk });

		await client.sendMessage({
			sessionId: "session-1",
			role: "user",
			content: "hello",
		});

		expect(calls.prompt).toHaveLength(1);
		expect(calls.prompt[0]?.body.model).toEqual({
			providerID: "openai",
			modelID: "gpt-5.2-codex",
		});
	});

	test("requestStop and closeSession abort the session", async () => {
		await client.requestStop("session-1");
		await client.closeSession("session-2");

		expect(calls.abort).toHaveLength(2);
		expect(calls.abort[0]?.path.id).toBe("session-1");
		expect(calls.abort[1]?.path.id).toBe("session-2");
	});

	test("pause and resume send control prompts", async () => {
		await client.pauseSession("session-1");
		await client.resumeSession("session-1");

		expect(calls.prompt).toHaveLength(2);
		expect(calls.prompt[0]?.body.parts).toEqual([
			{ type: "text", text: "Pare e retorne agora." },
		]);
		expect(calls.prompt[1]?.body.parts).toEqual([
			{ type: "text", text: "Continue de onde estava." },
		]);
	});
});
