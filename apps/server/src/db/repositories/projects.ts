import type { Kysely } from "kysely";
import { sql } from "kysely";
import type { Database } from "../types";

export function createProjectsRepository(db: Kysely<Database>) {
	return {
		async create(data: {
			id: string;
			name: string;
			path: string;
			description?: string | null;
		}) {
			return await db
				.insertInto("projects")
				.values({
					id: data.id,
					name: data.name,
					path: data.path,
					description: data.description ?? null,
				})
				.returningAll()
				.executeTakeFirstOrThrow();
		},

		async findById(id: string) {
			return await db
				.selectFrom("projects")
				.where("id", "=", id)
				.selectAll()
				.executeTakeFirst();
		},

		async list() {
			return await db.selectFrom("projects").selectAll().execute();
		},

		async update(
			id: string,
			data: Partial<{ name: string; path: string; description: string | null }>,
		) {
			return await db
				.updateTable("projects")
				.set(data)
				.where("id", "=", id)
				.returningAll()
				.executeTakeFirst();
		},

		async delete(id: string) {
			return await db
				.deleteFrom("projects")
				.where("id", "=", id)
				.returningAll()
				.executeTakeFirst();
		},

		async listWithTasksAndRunningStatus() {
			// Get all projects
			const projects = await db.selectFrom("projects").selectAll().execute();

			// Get all tasks with their running status
			const tasksWithStatus = await db
				.selectFrom("tasks")
				.leftJoin("execution_runs", (join) =>
					join
						.onRef("execution_runs.task_id", "=", "tasks.id")
						.on("execution_runs.status", "in", ["running", "stopping"]),
				)
				.select([
					"tasks.id",
					"tasks.project_id",
					"tasks.title",
					"tasks.completed_at",
					sql<number>`CASE WHEN execution_runs.id IS NOT NULL THEN 1 ELSE 0 END`.as(
						"is_running",
					),
				])
				.orderBy("tasks.created_at", "desc")
				.execute();

			// Group tasks by project
			const tasksByProject = new Map<
				string,
				Array<{
					id: string;
					title: string;
					isRunning: boolean;
					isCompleted: boolean;
				}>
			>();

			for (const task of tasksWithStatus) {
				const projectTasks = tasksByProject.get(task.project_id) ?? [];
				projectTasks.push({
					id: task.id,
					title: task.title,
					isRunning: task.is_running === 1,
					isCompleted: task.completed_at !== null,
				});
				tasksByProject.set(task.project_id, projectTasks);
			}

			// Build result with tasks nested under projects
			return projects.map((project) => ({
				id: project.id,
				name: project.name,
				tasks: tasksByProject.get(project.id) ?? [],
			}));
		},
	};
}
