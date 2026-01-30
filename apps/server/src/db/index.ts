import { Database as BunDatabase } from "bun:sqlite";
import { Kysely } from "kysely";
import { BunSqliteDialect } from "kysely-bun-sqlite";
import { DB_PATH, ensureDataDirs } from "../lib/paths";
import { runMigrations } from "./migrations";
import type { Database } from "./types";

ensureDataDirs();

const sqlite = new BunDatabase(DB_PATH, { create: true });

sqlite.run("PRAGMA foreign_keys = ON");

export const db = new Kysely<Database>({
	dialect: new BunSqliteDialect({ database: sqlite }),
});

async function reconcileOrphanedState(db: Kysely<Database>) {
	const now = new Date().toISOString();

	await db
		.updateTable("execution_runs")
		.set({ status: "error", error: "Server restarted", finished_at: now })
		.where("status", "=", "running")
		.execute();

	await db
		.updateTable("execution_runs")
		.set({ status: "stopped", error: "Server restarted", finished_at: now })
		.where("status", "=", "stopping")
		.execute();

	await db
		.updateTable("subtasks")
		.set({ status: "failed", error: "Server restarted" })
		.where("status", "=", "in_progress")
		.execute();

	await db
		.updateTable("ai_sessions")
		.set({ status: "error", last_error: "Server restarted" })
		.where("status", "not in", ["idle", "completed", "failed", "stopped"])
		.execute();
}

await runMigrations(db);
await reconcileOrphanedState(db);
