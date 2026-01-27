import { beforeEach, describe, expect, test } from "bun:test";
import { createProjectsRepository } from "../db/repositories/projects";
import { createSubtasksRepository } from "../db/repositories/subtasks";
import { createTasksRepository } from "../db/repositories/tasks";
import {
	createProject,
	createSubtask,
	createTask,
	createTestDb,
} from "./helpers";

describe("SubtasksRepository", () => {
	let db: Awaited<ReturnType<typeof createTestDb>>;
	let projects: ReturnType<typeof createProjectsRepository>;
	let tasks: ReturnType<typeof createTasksRepository>;
	let subtasks: ReturnType<typeof createSubtasksRepository>;
	let taskId: string;

	beforeEach(async () => {
		db = await createTestDb();
		projects = createProjectsRepository(db);
		tasks = createTasksRepository(db);
		subtasks = createSubtasksRepository(db);

		const project = await projects.create(createProject());
		const task = await tasks.create(createTask(project.id));
		taskId = task.id;
	});

	describe("create", () => {
		test("creates a subtask", async () => {
			const data = createSubtask(taskId, { name: "Write tests" });

			const created = await subtasks.create(data);

			expect(created?.id).toBe(data.id);
			expect(created?.task_id).toBe(taskId);
			expect(created?.name).toBe("Write tests");
			expect(created?.status).toBe("waiting");
			expect(created?.should_commit).toBe(0);
		});

		test("creates subtask with all fields", async () => {
			const data = createSubtask(taskId, {
				name: "Full subtask",
				acceptance_criterias: '["criterion 1", "criterion 2"]',
				out_of_scope: '["not this"]',
				category: "code",
				status: "in_progress",
				should_commit: 1,
				key_decisions: '["decision 1"]',
				files: '["file.ts"]',
				notes: "Some notes",
			});

			const created = await subtasks.create(data);

			expect(created?.acceptance_criterias).toBe(
				'["criterion 1", "criterion 2"]',
			);
			expect(created?.category).toBe("code");
			expect(created?.status).toBe("in_progress");
			expect(created?.should_commit).toBe(1);
		});
	});

	describe("createMany", () => {
		test("creates multiple subtasks", async () => {
			const data = [
				createSubtask(taskId, { name: "Subtask 1" }),
				createSubtask(taskId, { name: "Subtask 2" }),
				createSubtask(taskId, { name: "Subtask 3" }),
			];

			const created = await subtasks.createMany(data);

			expect(created).toHaveLength(3);
			expect(created.map((s) => s.name)).toEqual([
				"Subtask 1",
				"Subtask 2",
				"Subtask 3",
			]);
		});

		test("returns empty array when given empty array", async () => {
			const created = await subtasks.createMany([]);

			expect(created).toEqual([]);
		});
	});

	describe("findById", () => {
		test("returns subtask when exists", async () => {
			const data = createSubtask(taskId);
			await subtasks.create(data);

			const found = await subtasks.findById(data.id);

			expect(found).toBeDefined();
			expect(found?.id).toBe(data.id);
		});

		test("returns undefined when not exists", async () => {
			const found = await subtasks.findById("non-existent-id");

			expect(found).toBeUndefined();
		});
	});

	describe("listByTask", () => {
		test("returns empty array when no subtasks", async () => {
			const all = await subtasks.listByTask(taskId);

			expect(all).toEqual([]);
		});

		test("returns subtasks for specific task", async () => {
			await subtasks.create(createSubtask(taskId, { name: "A" }));
			await subtasks.create(createSubtask(taskId, { name: "B" }));

			const project2 = await projects.create(createProject({ name: "Other" }));
			const task2 = await tasks.create(createTask(project2.id));
			await subtasks.create(createSubtask(task2.id, { name: "Other" }));

			const taskSubtasks = await subtasks.listByTask(taskId);

			expect(taskSubtasks).toHaveLength(2);
			expect(taskSubtasks.every((s) => s.task_id === taskId)).toBe(true);
		});

		test("includes index based on insertion order", async () => {
			await subtasks.create(createSubtask(taskId, { name: "First" }));
			await subtasks.create(createSubtask(taskId, { name: "Second" }));
			await subtasks.create(createSubtask(taskId, { name: "Third" }));

			const all = await subtasks.listByTask(taskId);

			expect(all[0].index).toBe(1);
			expect(all[1].index).toBe(2);
			expect(all[2].index).toBe(3);
		});
	});

	describe("update", () => {
		test("updates subtask status", async () => {
			const data = createSubtask(taskId);
			await subtasks.create(data);

			const updated = await subtasks.update(data.id, { status: "completed" });

			expect(updated?.status).toBe("completed");
		});

		test("updates multiple fields", async () => {
			const data = createSubtask(taskId);
			await subtasks.create(data);

			const updated = await subtasks.update(data.id, {
				name: "Updated name",
				category: "test",
				should_commit: 1,
				notes: "New notes",
			});

			expect(updated?.name).toBe("Updated name");
			expect(updated?.category).toBe("test");
			expect(updated?.should_commit).toBe(1);
			expect(updated?.notes).toBe("New notes");
		});

		test("returns undefined when subtask not exists", async () => {
			const updated = await subtasks.update("non-existent", {
				status: "completed",
			});

			expect(updated).toBeUndefined();
		});
	});

	describe("delete", () => {
		test("deletes subtask", async () => {
			const data = createSubtask(taskId);
			await subtasks.create(data);

			const deleted = await subtasks.delete(data.id);

			expect(deleted?.id).toBe(data.id);

			const found = await subtasks.findById(data.id);
			expect(found).toBeUndefined();
		});

		test("returns undefined when subtask not exists", async () => {
			const deleted = await subtasks.delete("non-existent");

			expect(deleted).toBeUndefined();
		});
	});
});
