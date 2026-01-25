import { beforeEach, describe, expect, test } from "bun:test";
import { ClaudeCodeClient } from "../ai/services/claude-code";
import { createTestDb } from "./helpers";

const MODEL = "claude-3-5-haiku-20241022";

describe("ClaudeCodeClient", () => {
	let db: Awaited<ReturnType<typeof createTestDb>>;
	let client: ClaudeCodeClient;

	beforeEach(async () => {
		db = await createTestDb();
		client = new ClaudeCodeClient({ model: MODEL, db });
	});

	describe("createSession", () => {
		test("creates session with model and scope", async () => {
			const session = await client.createSession({
				title: "Test Session",
				model: MODEL,
				scope: { projectId: "project-1" },
			});

			expect(session.id).toBeDefined();
			expect(session.model).toBe(MODEL);
			expect(session.title).toBe("Test Session");
			expect(session.scope?.projectId).toBe("project-1");
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
		});
	});

	describe("sendMessage", () => {
		test(
			"sends message and receives response",
			async () => {
				const session = await client.createSession({ model: MODEL });

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
			},
			{ timeout: 30000 },
		);

		test(
			"continues conversation across messages",
			async () => {
				const session = await client.createSession({ model: MODEL });

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
			},
			{ timeout: 60000 },
		);
	});

	describe("getMessages", () => {
		test(
			"returns all messages from session",
			async () => {
				const session = await client.createSession({ model: MODEL });

				await client.sendMessage({
					sessionId: session.id,
					role: "user",
					content: "Say 'one'",
				});

				const messages = await client.getMessages({ sessionId: session.id });

				expect(messages).toHaveLength(2);
				expect(messages[0].role).toBe("user");
				expect(messages[1].role).toBe("assistant");
			},
			{ timeout: 30000 },
		);
	});

	describe("listSessions", () => {
		test("lists sessions filtered by scope", async () => {
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
		test(
			"pauses and resumes session",
			async () => {
				const session = await client.createSession({ model: MODEL });

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
			},
			{ timeout: 30000 },
		);

		test("stops session", async () => {
			const session = await client.createSession({ model: MODEL });

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
			const session = await client.createSession({ model: MODEL });

			await client.closeSession(session.id);

			const closed = await client.getSession(session.id);

			expect(closed?.status).toBe("stopped");
		});
	});
});
