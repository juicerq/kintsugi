import { describe, expect, test } from "bun:test";
import { safe, safeSync, withErrorHandler } from "../lib/safe";

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

describe("safeSync", () => {
	test("returns value on success", () => {
		const result = safeSync(() => JSON.parse('{"a":1}'));

		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.value).toEqual({ a: 1 });
		}
	});

	test("returns error on failure", () => {
		const result = safeSync(() => JSON.parse("invalid"));

		expect(result.ok).toBe(false);
	});
});

describe("withErrorHandler", () => {
	test("returns value on success", async () => {
		const result = await withErrorHandler(
			async () => "success",
			() => {},
		);

		expect(result).toBe("success");
	});

	test("calls onError and rethrows on failure", async () => {
		let errorLogged: Error | null = null;

		await expect(
			withErrorHandler(
				async () => {
					throw new Error("test error");
				},
				(error) => {
					errorLogged = error;
				},
			),
		).rejects.toThrow("test error");

		expect(errorLogged?.message).toBe("test error");
	});

	test("normalizes non-Error to Error", async () => {
		let errorLogged: Error | null = null;

		await expect(
			withErrorHandler(
				async () => {
					throw "string error";
				},
				(error) => {
					errorLogged = error;
				},
			),
		).rejects.toThrow("string error");

		expect(errorLogged).toBeInstanceOf(Error);
		expect(errorLogged?.message).toBe("string error");
	});

	test("rethrowOnly skips onError when returns true", async () => {
		let onErrorCalled = false;

		class CustomError extends Error {}

		await expect(
			withErrorHandler(
				async () => {
					throw new CustomError("custom");
				},
				() => {
					onErrorCalled = true;
				},
				{ rethrowOnly: (e) => e instanceof CustomError },
			),
		).rejects.toThrow("custom");

		expect(onErrorCalled).toBe(false);
	});

	test("rethrowOnly calls onError when returns false", async () => {
		let onErrorCalled = false;

		await expect(
			withErrorHandler(
				async () => {
					throw new Error("normal");
				},
				() => {
					onErrorCalled = true;
				},
				{ rethrowOnly: (e) => e instanceof SyntaxError },
			),
		).rejects.toThrow("normal");

		expect(onErrorCalled).toBe(true);
	});

	test("awaits async onError", async () => {
		let asyncCompleted = false;

		await expect(
			withErrorHandler(
				async () => {
					throw new Error("test");
				},
				async () => {
					await new Promise((r) => setTimeout(r, 10));
					asyncCompleted = true;
				},
			),
		).rejects.toThrow();

		expect(asyncCompleted).toBe(true);
	});
});
