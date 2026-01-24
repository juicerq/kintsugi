import type { Database } from "bun:sqlite";

export function initSchema(db: Database) {
  db.run(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      path TEXT NOT NULL,
      description TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      branch_name TEXT,
      brainstorm TEXT,
      architecture TEXT,
      review TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS subtasks (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      acceptance_criterias TEXT,
      out_of_scope TEXT,
      category TEXT CHECK(category IN ('code', 'test', 'docs', 'fix', 'refactor')),
      status TEXT DEFAULT 'waiting' CHECK(status IN ('waiting', 'in_progress', 'completed')),
      started_at TEXT,
      finished_at TEXT,
      should_commit INTEGER DEFAULT 0,
      key_decisions TEXT,
      files TEXT,
      notes TEXT
    )
  `);

  // Indexes for common queries
  db.run(`CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_subtasks_task_id ON subtasks(task_id)`);
}
