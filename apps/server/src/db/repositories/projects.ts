import type { Kysely } from "kysely";
import type { Database } from "../types";

export function createProjectsRepository(db: Kysely<Database>) {
  return {
    async create(data: { id: string; name: string; path: string; description?: string | null }) {
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

    async update(id: string, data: Partial<{ name: string; path: string; description: string | null }>) {
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
  };
}
