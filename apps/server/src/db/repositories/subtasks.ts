import type { Kysely } from "kysely";
import { sql } from "kysely";
import type { Database, SubtaskStatus } from "../types";

export function createSubtasksRepository(db: Kysely<Database>) {
  return {
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

    async update(
      id: string,
      data: Partial<{
        status: SubtaskStatus;
        should_commit: number;
      }>
    ) {
      return await db
        .updateTable("subtasks")
        .set(data)
        .where("id", "=", id)
        .returningAll()
        .executeTakeFirst();
    },
  };
}
