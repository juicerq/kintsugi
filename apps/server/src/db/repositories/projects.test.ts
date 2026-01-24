import { describe, test, expect, beforeEach } from "bun:test";
import { createTestDb, createProject } from "../../../test/helpers";
import { createProjectsRepository } from "./projects";

describe("ProjectsRepository", () => {
  let db: ReturnType<typeof createTestDb>;
  let projects: ReturnType<typeof createProjectsRepository>;

  beforeEach(() => {
    db = createTestDb();
    projects = createProjectsRepository(db);
  });

  describe("create", () => {
    test("creates a project", async () => {
      const data = createProject({ name: "My App" });
      const created = await projects.create(data);

      expect(created.id).toBe(data.id);
      expect(created.name).toBe("My App");
      expect(created.path).toBe("/tmp/test");
      expect(created.description).toBeNull();
      expect(created.created_at).toBeDefined();
    });

    test("creates project with description", async () => {
      const data = createProject({ description: "A test project" });
      const created = await projects.create(data);

      expect(created.description).toBe("A test project");
    });
  });

  describe("findById", () => {
    test("returns project when exists", async () => {
      const data = createProject();
      await projects.create(data);

      const found = await projects.findById(data.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(data.id);
    });

    test("returns undefined when not exists", async () => {
      const found = await projects.findById("non-existent-id");

      expect(found).toBeUndefined();
    });
  });

  describe("list", () => {
    test("returns empty array when no projects", async () => {
      const all = await projects.list();

      expect(all).toEqual([]);
    });

    test("returns all projects", async () => {
      await projects.create(createProject({ name: "A" }));
      await projects.create(createProject({ name: "B" }));
      await projects.create(createProject({ name: "C" }));

      const all = await projects.list();

      expect(all).toHaveLength(3);
    });
  });

  describe("update", () => {
    test("updates project name", async () => {
      const data = createProject({ name: "Old Name" });
      await projects.create(data);

      const updated = await projects.update(data.id, { name: "New Name" });

      expect(updated?.name).toBe("New Name");
    });

    test("returns undefined when project not exists", async () => {
      const updated = await projects.update("non-existent", { name: "Test" });

      expect(updated).toBeUndefined();
    });
  });

  describe("delete", () => {
    test("deletes project", async () => {
      const data = createProject();
      await projects.create(data);

      const deleted = await projects.delete(data.id);

      expect(deleted?.id).toBe(data.id);

      const found = await projects.findById(data.id);
      expect(found).toBeUndefined();
    });

    test("returns undefined when project not exists", async () => {
      const deleted = await projects.delete("non-existent");

      expect(deleted).toBeUndefined();
    });
  });
});
