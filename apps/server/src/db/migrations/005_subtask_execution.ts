import { type Kysely, sql } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
	await sql`DROP TABLE IF EXISTS subtasks_new`.execute(db);

	await sql`
    CREATE TABLE subtasks_new (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      acceptance_criterias TEXT,
      out_of_scope TEXT,
      category TEXT CHECK(category IN ('code', 'test', 'docs', 'fix', 'refactor')),
      status TEXT DEFAULT 'waiting' CHECK(status IN ('waiting', 'in_progress', 'completed', 'failed')),
      started_at TEXT,
      finished_at TEXT,
      should_commit INTEGER DEFAULT 0,
      key_decisions TEXT,
      files TEXT,
      notes TEXT,
      steps TEXT,
      error TEXT
    )
  `.execute(db);

	await sql`
    INSERT INTO subtasks_new (id, task_id, name, acceptance_criterias, out_of_scope, category, status,
           started_at, finished_at, should_commit, key_decisions, files, notes, steps)
    SELECT id, task_id, name, acceptance_criterias, out_of_scope, category, status,
           started_at, finished_at, should_commit, key_decisions, files, notes, steps
    FROM subtasks
  `.execute(db);

	await sql`DROP TABLE subtasks`.execute(db);
	await sql`ALTER TABLE subtasks_new RENAME TO subtasks`.execute(db);

	await db.schema
		.createIndex("idx_subtasks_task_id")
		.on("subtasks")
		.column("task_id")
		.execute();
}
