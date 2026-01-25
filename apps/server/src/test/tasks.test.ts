import { beforeEach, describe, expect, test } from "bun:test";
import { createProjectsRepository } from "../db/repositories/projects";
import { createTasksRepository } from "../db/repositories/tasks";
import { createProject, createTask, createTestDb } from "./helpers";

describe("TasksRepository", () => {
	let db: Awaited<ReturnType<typeof createTestDb>>;
	let projects: ReturnType<typeof createProjectsRepository>;
	let tasks: ReturnType<typeof createTasksRepository>;
	let projectId: string;

	beforeEach(async () => {
		db = await createTestDb();
		projects = createProjectsRepository(db);
		tasks = createTasksRepository(db);

		const project = await projects.create(createProject());
		projectId = project.id;
	});

	describe("create", () => {
		test("creates a task", async () => {
			const data = createTask(projectId, { title: "Implement feature" });
			const created = await tasks.create(data);

			expect(created.id).toBe(data.id);
			expect(created.project_id).toBe(projectId);
			expect(created.title).toBe("Implement feature");
			expect(created.created_at).toBeDefined();
		});

		test("creates task with all fields", async () => {
			const data = createTask(projectId, {
				title: "Full Task",
				description: "A detailed description",
				branch_name: "feature/my-task",
				brainstorm: "Ideas here",
				architecture: "Design here",
				review: "Review notes",
			});
			const created = await tasks.create(data);

			expect(created.description).toBe("A detailed description");
			expect(created.branch_name).toBe("feature/my-task");
			expect(created.brainstorm).toBe("Ideas here");
		});
	});

	describe("findById", () => {
		test("returns task when exists", async () => {
			const data = createTask(projectId);
			await tasks.create(data);

			const found = await tasks.findById(data.id);

			expect(found).toBeDefined();
			expect(found?.id).toBe(data.id);
		});

		test("returns undefined when not exists", async () => {
			const found = await tasks.findById("non-existent-id");

			expect(found).toBeUndefined();
		});
	});

	describe("listByProject", () => {
		test("returns empty array when no tasks", async () => {
			const all = await tasks.listByProject(projectId);

			expect(all).toEqual([]);
		});

		test("returns tasks for specific project", async () => {
			await tasks.create(createTask(projectId, { title: "Task 1" }));
			await tasks.create(createTask(projectId, { title: "Task 2" }));

			const otherProject = await projects.create(
				createProject({ name: "Other" }),
			);
			await tasks.create(createTask(otherProject.id, { title: "Other Task" }));

			const projectTasks = await tasks.listByProject(projectId);

			expect(projectTasks).toHaveLength(2);
			expect(projectTasks.every((t) => t.project_id === projectId)).toBe(true);
		});
	});

	describe("update", () => {
		test("updates task fields", async () => {
			const data = createTask(projectId, { title: "Old Title" });
			await tasks.create(data);

			const updated = await tasks.update(data.id, {
				title: "New Title",
				brainstorm: "New ideas",
			});

			expect(updated?.title).toBe("New Title");
			expect(updated?.brainstorm).toBe("New ideas");
		});

		test("returns undefined when task not exists", async () => {
			const updated = await tasks.update("non-existent", { title: "Test" });

			expect(updated).toBeUndefined();
		});
	});

	describe("delete", () => {
		test("deletes task", async () => {
			const data = createTask(projectId);
			await tasks.create(data);

			const deleted = await tasks.delete(data.id);

			expect(deleted?.id).toBe(data.id);

			const found = await tasks.findById(data.id);
			expect(found).toBeUndefined();
		});
	});
});
