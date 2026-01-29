import { describe, test, expect, beforeEach } from "bun:test";
import { createLogger, truncate } from "./logger";

describe("logger", () => {
	let writes: Array<{ path: string; data: string }>;
	let testLogger: ReturnType<typeof createLogger>;

	beforeEach(() => {
		writes = [];
		testLogger = createLogger(async (path, data) => {
			writes.push({ path, data });
		});
	});

	test("writes to daily file", async () => {
		testLogger.info("test message");
		await testLogger.flushNow();

		expect(writes.length).toBe(1);
		expect(writes[0].path).toContain("daily/");
		expect(writes[0].data).toContain('"msg":"test message"');
	});

	test("writes to session file when sessionId provided", async () => {
		testLogger.info("test", { sessionId: "abc123" });
		await testLogger.flushNow();

		expect(writes.length).toBe(2);
		expect(writes.some((w) => w.path.includes("sessions/abc123"))).toBe(true);
	});

	test("forSession creates scoped logger", async () => {
		const sessionLog = testLogger.forSession("xyz");
		sessionLog.info("scoped message");
		await testLogger.flushNow();

		expect(writes.length).toBe(2);
		const sessionWrite = writes.find((w) => w.path.includes("xyz"));
		expect(sessionWrite?.data).toContain('"sessionId":"xyz"');
	});

	test("sanitizes sensitive data", async () => {
		testLogger.info("key is sk-1234567890abcdefghij");
		await testLogger.flushNow();

		expect(writes[0].data).toContain("[REDACTED]");
		expect(writes[0].data).not.toContain("sk-1234567890");
	});

	test("sanitizes github tokens", async () => {
		testLogger.info("token: ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");
		await testLogger.flushNow();

		expect(writes[0].data).toContain("[REDACTED]");
		expect(writes[0].data).not.toContain("ghp_");
	});

	test("sanitizes bearer tokens", async () => {
		testLogger.info("Authorization: Bearer abc123xyz");
		await testLogger.flushNow();

		expect(writes[0].data).toContain("[REDACTED]");
		expect(writes[0].data).not.toContain("Bearer abc123");
	});

	test("error includes stack trace", async () => {
		const err = new Error("test error");
		testLogger.error("failed", err);
		await testLogger.flushNow();

		expect(writes[0].data).toContain('"error":"test error"');
		expect(writes[0].data).toContain('"stack"');
	});

	test("batches multiple writes", async () => {
		testLogger.info("msg1");
		testLogger.info("msg2");
		testLogger.info("msg3");
		await testLogger.flushNow();

		expect(writes.length).toBe(1);
		expect(writes[0].data).toContain("msg1");
		expect(writes[0].data).toContain("msg2");
		expect(writes[0].data).toContain("msg3");
	});

	test("includes timestamp and level", async () => {
		testLogger.warn("warning message");
		await testLogger.flushNow();

		expect(writes[0].data).toContain('"level":"warn"');
		expect(writes[0].data).toContain('"ts":"');
	});

	test("includes context fields", async () => {
		testLogger.info("with context", { userId: "123", action: "login" });
		await testLogger.flushNow();

		expect(writes[0].data).toContain('"userId":"123"');
		expect(writes[0].data).toContain('"action":"login"');
	});
});

describe("truncate", () => {
	test("returns short strings unchanged", () => {
		expect(truncate("short", 100)).toBe("short");
	});

	test("truncates long strings with indicator", () => {
		const long = "a".repeat(2000);
		const result = truncate(long, 100);
		expect(result.length).toBeLessThan(200);
		expect(result).toContain("...[truncated");
	});

	test("shows truncated char count", () => {
		const long = "a".repeat(150);
		const result = truncate(long, 100);
		expect(result).toContain("...[truncated 50 chars]");
	});

	test("uses default max length", () => {
		const long = "a".repeat(2000);
		const result = truncate(long);
		expect(result).toContain("...[truncated 976 chars]");
	});
});
