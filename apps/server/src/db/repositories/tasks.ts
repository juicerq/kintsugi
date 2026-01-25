import type { Kysely } from "kysely";
import { sql } from "kysely";
import type { Database } from "../types";

export function createTasksRepository(db: Kysely<Database>) {
  return {
    async create(data: {
      id: string;
      project_id: string;
      title: string;
      description?: string | null;
      branch_name?: string | null;
      brainstorm?: string | null;
      architecture?: string | null;
      review?: string | null;
    }) {
      return await db
        .insertInto("tasks")
        .values({
          id: data.id,
          project_id: data.project_id,
          title: data.title,
          description: data.description ?? null,
          branch_name: data.branch_name ?? null,
          brainstorm: data.brainstorm ?? null,
          architecture: data.architecture ?? null,
          review: data.review ?? null,
        })
        .returningAll()
        .executeTakeFirstOrThrow();
    },

    async findById(id: string) {
      return await db
        .selectFrom("tasks")
        .where("id", "=", id)
        .selectAll()
        .executeTakeFirst();
    },

    async listByProject(projectId: string) {
      return await db
        .selectFrom("tasks")
        .where("project_id", "=", projectId)
        .selectAll()
        .execute();
    },

    async listByProjectWithSubtaskCounts(projectId: string) {
      return await db
        .selectFrom("tasks")
        .leftJoin("subtasks", "subtasks.task_id", "tasks.id")
        .where("tasks.project_id", "=", projectId)
        .groupBy("tasks.id")
        .select([
          "tasks.id",
          "tasks.project_id",
          "tasks.title",
          "tasks.description",
          "tasks.branch_name",
          "tasks.brainstorm",
          "tasks.architecture",
          "tasks.review",
          "tasks.created_at",
          "tasks.completed_at",
          sql<number>`COUNT(subtasks.id)`.as("total_subtasks"),
          sql<number>`COUNT(CASE WHEN subtasks.status = 'completed' THEN 1 END)`.as("completed_subtasks"),
        ])
        .orderBy(sql`tasks.completed_at IS NOT NULL`, "asc")
        .orderBy("tasks.created_at", "desc")
        .execute();
    },

    async toggleComplete(id: string) {
      const task = await db
        .selectFrom("tasks")
        .where("id", "=", id)
        .select(["completed_at"])
        .executeTakeFirst();

      if (!task) return null;

      const newCompletedAt = task.completed_at ? null : new Date().toISOString();

      return await db
        .updateTable("tasks")
        .set({ completed_at: newCompletedAt })
        .where("id", "=", id)
        .returningAll()
        .executeTakeFirst();
    },

    async update(id: string, data: Partial<{
      title: string;
      description: string | null;
      branch_name: string | null;
      brainstorm: string | null;
      architecture: string | null;
      review: string | null;
    }>) {
      return await db
        .updateTable("tasks")
        .set(data)
        .where("id", "=", id)
        .returningAll()
        .executeTakeFirst();
    },

    async delete(id: string) {
      return await db
        .deleteFrom("tasks")
        .where("id", "=", id)
        .returningAll()
        .executeTakeFirst();
    },
  };
}
