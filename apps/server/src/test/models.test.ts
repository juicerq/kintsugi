import { describe, expect, test } from "bun:test";
import { resolveModelKey } from "../ai/models";

describe("resolveModelKey", () => {
	test("returns key for matching model id", () => {
		const key = resolveModelKey({
			modelId: "openai/gpt-5.2-codex",
			service: "opencode",
		});

		expect(key).toBe("gpt-5.2-codex");
	});

	test("returns null when model id is missing", () => {
		const key = resolveModelKey({ modelId: null, service: "claude" });

		expect(key).toBeNull();
	});

	test("returns null when model id does not match", () => {
		const key = resolveModelKey({
			modelId: "unknown-model",
			service: "opencode",
		});

		expect(key).toBeNull();
	});
});
