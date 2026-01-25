import { Kysely, sql } from "kysely"

export async function up(db: Kysely<unknown>): Promise<void> {
  const tables = await sql<{ name: string }>`
    SELECT name FROM sqlite_master WHERE type='table' AND name='projects'
  `.execute(db)

  if (tables.rows.length > 0) {
    return
  }

  await db.schema
    .createTable("projects")
    .addColumn("id", "text", (col) => col.primaryKey())
    .addColumn("name", "text", (col) => col.notNull())
    .addColumn("path", "text", (col) => col.notNull())
    .addColumn("description", "text")
    .addColumn("created_at", "text", (col) =>
      col.defaultTo(sql`CURRENT_TIMESTAMP`)
    )
    .execute()

  await db.schema
    .createTable("tasks")
    .addColumn("id", "text", (col) => col.primaryKey())
    .addColumn("project_id", "text", (col) =>
      col.notNull().references("projects.id").onDelete("cascade")
    )
    .addColumn("title", "text", (col) => col.notNull())
    .addColumn("description", "text")
    .addColumn("branch_name", "text")
    .addColumn("brainstorm", "text")
    .addColumn("architecture", "text")
    .addColumn("review", "text")
    .addColumn("created_at", "text", (col) =>
      col.defaultTo(sql`CURRENT_TIMESTAMP`)
    )
    .addColumn("completed_at", "text")
    .execute()

  await db.schema
    .createTable("subtasks")
    .addColumn("id", "text", (col) => col.primaryKey())
    .addColumn("task_id", "text", (col) =>
      col.notNull().references("tasks.id").onDelete("cascade")
    )
    .addColumn("name", "text", (col) => col.notNull())
    .addColumn("acceptance_criterias", "text")
    .addColumn("out_of_scope", "text")
    .addColumn("category", "text", (col) =>
      col.check(
        sql`category IN ('code', 'test', 'docs', 'fix', 'refactor')`
      )
    )
    .addColumn("status", "text", (col) =>
      col
        .defaultTo("waiting")
        .check(sql`status IN ('waiting', 'in_progress', 'completed')`)
    )
    .addColumn("started_at", "text")
    .addColumn("finished_at", "text")
    .addColumn("should_commit", "integer", (col) => col.defaultTo(0))
    .addColumn("key_decisions", "text")
    .addColumn("files", "text")
    .addColumn("notes", "text")
    .execute()

  await db.schema
    .createIndex("idx_tasks_project_id")
    .on("tasks")
    .column("project_id")
    .execute()

  await db.schema
    .createIndex("idx_subtasks_task_id")
    .on("subtasks")
    .column("task_id")
    .execute()
}
