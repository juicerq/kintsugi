import { type Kysely, sql } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
	await sql`
    CREATE TABLE execution_runs (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      status TEXT NOT NULL CHECK(status IN ('running', 'stopping', 'stopped', 'completed', 'error')),
      current_subtask_id TEXT REFERENCES subtasks(id) ON DELETE SET NULL,
      current_session_id TEXT,
      error TEXT,
      service TEXT NOT NULL,
      started_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      finished_at TEXT
    )
  `.execute(db);

	await sql`CREATE INDEX idx_execution_runs_task_id ON execution_runs(task_id)`.execute(
		db,
	);
}
