import { beforeEach, describe, expect, test } from "bun:test";
import { modelsMap } from "../ai/models";
import type { AiRole } from "../ai/types";
import { ClaudeCodeClient } from "../ai/services/claude-code";
import { createProjectsRepository } from "../db/repositories/projects";
import { createProject, createTestDb } from "./helpers";

const MODEL = modelsMap["haiku-4.5"].claude;
const TEST_REPO_PATH = "/tmp/kintsugi-test";

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

type QueryOptions = {
	model?: string;
	cwd?: string;
	resume?: string;
};

function createMockQueryFn(responseText = "Hello") {
	let callCount = 0;
	const sessions = new Map<string, string[]>();

	return function mockQuery(input: {
		prompt: string;
		options?: QueryOptions;
	}): AsyncIterable<ClaudeCodeSdkMessage> {
		callCount++;
		const sessionId = input.options?.resume ?? `mock-session-${callCount}`;

		const history = sessions.get(sessionId) ?? [];
		history.push(input.prompt);
		sessions.set(sessionId, history);

		return {
			async *[Symbol.asyncIterator]() {
				yield { type: "init", session_id: sessionId };

				if (input.prompt !== ".") {
					const reply =
						history.length > 2 && history.some((h) => h.includes("42"))
							? "42"
							: responseText;

					yield {
						type: "assistant",
						session_id: sessionId,
						message: {
							role: "assistant" as AiRole,
							content: [{ type: "text" as const, text: reply }],
						},
					};
				}

				yield { type: "result", session_id: sessionId };
			},
		};
	};
}

describe("ClaudeCodeClient", () => {
	let db: Awaited<ReturnType<typeof createTestDb>>;
	let client: ClaudeCodeClient;
	let projectsRepo: ReturnType<typeof createProjectsRepository>;

	beforeEach(async () => {
		db = await createTestDb();
		projectsRepo = createProjectsRepository(db);
		client = new ClaudeCodeClient({
			model: MODEL,
			db,
			queryFn: createMockQueryFn(),
		});
	});

	describe("createSession", () => {
		test("creates session with model and scope", async () => {
			const project = createProject({ id: "project-1", path: TEST_REPO_PATH });
			await projectsRepo.create(project);

			const session = await client.createSession({
				title: "Test Session",
				model: MODEL,
				scope: { projectId: "project-1" },
			});

			expect(session.id).toBeDefined();
			expect(session.model).toBe(MODEL);
			expect(session.title).toBe("Test Session");
			expect(session.scope?.projectId).toBe("project-1");
			expect(session.scope?.repoPath).toBe(TEST_REPO_PATH);
			expect(session.status).toBe("idle");
			expect(session.stopRequested).toBe(false);
			expect(session.createdAt).toBeDefined();

			const stored = await db
				.selectFrom("ai_sessions")
				.selectAll()
				.where("id", "=", session.id)
				.executeTakeFirstOrThrow();

			expect(stored.model).toBe(MODEL);
			expect(stored.scope_project_id).toBe("project-1");
			expect(stored.scope_repo_path).toBe(TEST_REPO_PATH);
		});

		test("creates session with explicit repoPath", async () => {
			const session = await client.createSession({
				title: "Test Session",
				model: MODEL,
				scope: { repoPath: TEST_REPO_PATH },
			});

			expect(session.id).toBeDefined();
			expect(session.scope?.repoPath).toBe(TEST_REPO_PATH);
		});

		test("throws when repoPath is not available", async () => {
			await expect(
				client.createSession({
					title: "Test Session",
					model: MODEL,
					scope: { projectId: "non-existent" },
				}),
			).rejects.toThrow("repoPath required for Claude Code sessions");
		});
	});

	describe("sendMessage", () => {
		test("sends message and receives response", async () => {
			const session = await client.createSession({
				model: MODEL,
				scope: { repoPath: TEST_REPO_PATH },
			});

			const response = await client.sendMessage({
				sessionId: session.id,
				role: "user",
				content: "Say only 'Hello' and nothing else.",
			});

			expect(response.id).toBeDefined();
			expect(response.role).toBe("assistant");
			expect(response.content).toBeDefined();
			expect(response.content.length).toBeGreaterThan(0);
			expect(response.createdAt).toBeDefined();

			const messages = await db
				.selectFrom("ai_messages")
				.selectAll()
				.where("session_id", "=", session.id)
				.orderBy("created_at", "asc")
				.execute();

			expect(messages).toHaveLength(2);
			expect(messages[0].role).toBe("user");
			expect(messages[1].role).toBe("assistant");

			const updatedSession = await db
				.selectFrom("ai_sessions")
				.selectAll()
				.where("id", "=", session.id)
				.executeTakeFirstOrThrow();

			expect(updatedSession.status).toBe("idle");
			expect(updatedSession.last_heartbeat_at).toBeDefined();
		});

		test("continues conversation across messages", async () => {
			const session = await client.createSession({
				model: MODEL,
				scope: { repoPath: TEST_REPO_PATH },
			});

			await client.sendMessage({
				sessionId: session.id,
				role: "user",
				content: "Remember the number 42. Just say 'OK'.",
			});

			const response = await client.sendMessage({
				sessionId: session.id,
				role: "user",
				content:
					"What number did I ask you to remember? Reply only the number.",
			});

			expect(response.content).toContain("42");

			const messages = await db
				.selectFrom("ai_messages")
				.selectAll()
				.where("session_id", "=", session.id)
				.execute();

			expect(messages).toHaveLength(4);
		});
	});

	describe("getMessages", () => {
		test("returns all messages from session", async () => {
			const session = await client.createSession({
				model: MODEL,
				scope: { repoPath: TEST_REPO_PATH },
			});

			await client.sendMessage({
				sessionId: session.id,
				role: "user",
				content: "Say 'one'",
			});

			const messages = await client.getMessages({ sessionId: session.id });

			expect(messages).toHaveLength(2);
			expect(messages[0].role).toBe("user");
			expect(messages[1].role).toBe("assistant");
		});
	});

	describe("listSessions", () => {
		test("lists sessions filtered by scope", async () => {
			const projectA = createProject({
				id: "project-a",
				path: "/tmp/project-a",
			});
			const projectB = createProject({
				id: "project-b",
				path: "/tmp/project-b",
			});
			await projectsRepo.create(projectA);
			await projectsRepo.create(projectB);

			await client.createSession({
				model: MODEL,
				scope: { projectId: "project-a" },
			});
			await client.createSession({
				model: MODEL,
				scope: { projectId: "project-b" },
			});

			const sessionsA = await client.listSessions({
				scope: { projectId: "project-a" },
			});
			const sessionsB = await client.listSessions({
				scope: { projectId: "project-b" },
			});
			const allSessions = await client.listSessions();

			expect(sessionsA).toHaveLength(1);
			expect(sessionsB).toHaveLength(1);
			expect(allSessions).toHaveLength(2);
		});
	});

	describe("getSession", () => {
		test("returns session by id", async () => {
			const created = await client.createSession({
				title: "Find me",
				model: MODEL,
				scope: { repoPath: TEST_REPO_PATH },
			});

			const found = await client.getSession(created.id);

			expect(found).toBeDefined();
			expect(found?.id).toBe(created.id);
			expect(found?.title).toBe("Find me");
		});

		test("returns null when not exists", async () => {
			const found = await client.getSession("non-existent-id");

			expect(found).toBeNull();
		});
	});

	describe("session control", () => {
		test("pauses and resumes session", async () => {
			const session = await client.createSession({
				model: MODEL,
				scope: { repoPath: TEST_REPO_PATH },
			});

			await client.pauseSession(session.id);

			const paused = await client.getSession(session.id);
			expect(paused?.status).toBe("paused");
			expect(paused?.stopRequested).toBe(true);

			await expect(
				client.sendMessage({
					sessionId: session.id,
					role: "user",
					content: "test",
				}),
			).rejects.toThrow("Session paused");

			await client.resumeSession(session.id);

			const resumed = await client.getSession(session.id);
			expect(resumed?.status).toBe("idle");
			expect(resumed?.stopRequested).toBe(false);

			const response = await client.sendMessage({
				sessionId: session.id,
				role: "user",
				content: "Say 'resumed'",
			});

			expect(response.content).toBeDefined();
		});

		test("stops session", async () => {
			const session = await client.createSession({
				model: MODEL,
				scope: { repoPath: TEST_REPO_PATH },
			});

			await client.requestStop(session.id);

			const stopped = await client.getSession(session.id);
			expect(stopped?.status).toBe("stopped");
			expect(stopped?.stopRequested).toBe(true);

			await expect(
				client.sendMessage({
					sessionId: session.id,
					role: "user",
					content: "test",
				}),
			).rejects.toThrow("Session stopped");
		});

		test("closes session", async () => {
			const session = await client.createSession({
				model: MODEL,
				scope: { repoPath: TEST_REPO_PATH },
			});

			await client.closeSession(session.id);

			const closed = await client.getSession(session.id);

			expect(closed?.status).toBe("stopped");
		});
	});
});
