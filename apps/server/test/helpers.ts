import { Database } from "bun:sqlite";
import { Kysely } from "kysely";
import { BunSqliteDialect } from "kysely-bun-sqlite";
import type { Database as DB } from "../src/db/types";
import { runMigrations } from "../src/db/migrations";

export async function createTestDb() {
  const sqlite = new Database(":memory:");
  sqlite.run("PRAGMA foreign_keys = ON");

  const db = new Kysely<DB>({
    dialect: new BunSqliteDialect({ database: sqlite }),
  });

  await runMigrations(db);
  return db;
}

export function createProject(overrides: Partial<{
  id: string;
  name: string;
  path: string;
  description: string | null;
}> = {}) {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    name: overrides.name ?? "Test Project",
    path: overrides.path ?? "/tmp/test",
    description: overrides.description ?? null,
  };
}

export function createTask(projectId: string, overrides: Partial<{
  id: string;
  title: string;
  description: string | null;
  branch_name: string | null;
  brainstorm: string | null;
  architecture: string | null;
  review: string | null;
}> = {}) {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    project_id: projectId,
    title: overrides.title ?? "Test Task",
    description: overrides.description ?? null,
    branch_name: overrides.branch_name ?? null,
    brainstorm: overrides.brainstorm ?? null,
    architecture: overrides.architecture ?? null,
    review: overrides.review ?? null,
  };
}

export function createSubtask(taskId: string, overrides: Partial<{
  id: string;
  name: string;
  acceptance_criterias: string | null;
  out_of_scope: string | null;
  category: "code" | "test" | "docs" | "fix" | "refactor" | null;
  status: "waiting" | "in_progress" | "completed";
  started_at: string | null;
  finished_at: string | null;
  should_commit: number;
  key_decisions: string | null;
  files: string | null;
  notes: string | null;
}> = {}) {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    task_id: taskId,
    name: overrides.name ?? "Test Subtask",
    acceptance_criterias: overrides.acceptance_criterias ?? null,
    out_of_scope: overrides.out_of_scope ?? null,
    category: overrides.category ?? null,
    status: overrides.status ?? "waiting",
    started_at: overrides.started_at ?? null,
    finished_at: overrides.finished_at ?? null,
    should_commit: overrides.should_commit ?? 0,
    key_decisions: overrides.key_decisions ?? null,
    files: overrides.files ?? null,
    notes: overrides.notes ?? null,
  };
}
