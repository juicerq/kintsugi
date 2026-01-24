import type { Kysely } from "kysely";
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
