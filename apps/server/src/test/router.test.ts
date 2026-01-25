import { beforeEach, describe, expect, test } from "bun:test";
import { createAppRouter } from "../router";
import { createTestDb } from "./helpers";

describe("AppRouter", () => {
	let db: Awaited<ReturnType<typeof createTestDb>>;
	let caller: ReturnType<ReturnType<typeof createAppRouter>["createCaller"]>;

	beforeEach(async () => {
		db = await createTestDb();
		const router = createAppRouter(db);
		caller = router.createCaller({});
	});

	describe("greet", () => {
		test("returns greeting with name", async () => {
			const result = await caller.greet({ name: "World" });

			expect(result).toBe("Hello, World!");
		});

		test("returns greeting with different name", async () => {
			const result = await caller.greet({ name: "Kintsugi" });

			expect(result).toBe("Hello, Kintsugi!");
		});

		test("rejects empty name", async () => {
			await expect(caller.greet({ name: "" })).rejects.toThrow();
		});
	});
});
