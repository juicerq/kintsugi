import { describe, test, expect, beforeEach } from "bun:test";
import { createTestDb } from "../test/helpers";
import { createAppRouter } from "./router";

describe("AppRouter", () => {
  let db: ReturnType<typeof createTestDb>;
  let caller: ReturnType<ReturnType<typeof createAppRouter>["createCaller"]>;

  beforeEach(() => {
    db = createTestDb();
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
