import type { Insertable, Kysely } from "kysely";
import { sql } from "kysely";
import type { Database, SubtaskCategory, SubtaskStatus, SubtaskTable } from "../types";

type SubtaskCreateData = Insertable<SubtaskTable>;

type SubtaskUpdateData = Partial<{
  name: string;
  acceptance_criterias: string | null;
  out_of_scope: string | null;
  category: SubtaskCategory | null;
  status: SubtaskStatus;
  should_commit: number;
  key_decisions: string | null;
  files: string | null;
  notes: string | null;
  started_at: string | null;
  finished_at: string | null;
}>;

export function createSubtasksRepository(db: Kysely<Database>) {
  return {
    async findById(id: string) {
      return await db
        .selectFrom("subtasks")
        .where("id", "=", id)
        .selectAll()
        .executeTakeFirst();
    },

    async listByTask(taskId: string) {
      return await db
        .selectFrom("subtasks")
        .where("task_id", "=", taskId)
        .select([
          "id",
          "task_id",
          "name",
          "acceptance_criterias",
          "out_of_scope",
          "category",
          "status",
          "started_at",
          "finished_at",
          "should_commit",
          "key_decisions",
          "files",
          "notes",
          sql<number>`ROW_NUMBER() OVER (ORDER BY rowid)`.as("index"),
        ])
        .execute();
    },

    async create(data: SubtaskCreateData) {
      return await db
        .insertInto("subtasks")
        .values(data)
        .returningAll()
        .executeTakeFirst();
    },

    async createMany(subtasks: SubtaskCreateData[]) {
      if (subtasks.length === 0) return [];
      return await db
        .insertInto("subtasks")
        .values(subtasks)
        .returningAll()
        .execute();
    },

    async update(id: string, data: SubtaskUpdateData) {
      return await db
        .updateTable("subtasks")
        .set(data)
        .where("id", "=", id)
        .returningAll()
        .executeTakeFirst();
    },

    async delete(id: string) {
      return await db
        .deleteFrom("subtasks")
        .where("id", "=", id)
        .returningAll()
        .executeTakeFirst();
    },
  };
}
