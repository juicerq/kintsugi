import { describe, expect, test } from "bun:test";
import { safe } from "./safe";

describe("safe", () => {
	test("returns Ok with value on success", async () => {
		const result = await safe(Promise.resolve(42));

		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.value).toBe(42);
		}
	});

	test("returns Ok with complex value", async () => {
		const data = { id: "123", name: "test" };
		const result = await safe(Promise.resolve(data));

		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.value).toEqual(data);
		}
	});

	test("returns Err with error on failure", async () => {
		const error = new Error("something broke");
		const result = await safe(Promise.reject(error));

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error).toBe(error);
		}
	});

	test("preserves error message", async () => {
		const result = await safe(Promise.reject(new Error("specific message")));

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.message).toBe("specific message");
		}
	});
});
