import { type Kysely, type Migration, Migrator } from "kysely";
import type { Database } from "../types";
import * as m001 from "./001_initial";
import * as m002 from "./002_ai_sessions";
import * as m003 from "./003_ai_session_control";
import * as m004 from "./004_subtask_steps";
import * as m005 from "./005_subtask_execution";

const migrations: Record<string, Migration> = {
	"001_initial": m001,
	"002_ai_sessions": m002,
	"003_ai_session_control": m003,
	"004_subtask_steps": m004,
	"005_subtask_execution": m005,
};

export async function runMigrations(db: Kysely<Database>) {
	const migrator = new Migrator({
		db,
		provider: { getMigrations: async () => migrations },
	});

	const { error, results } = await migrator.migrateToLatest();

	results?.forEach((result) => {
		if (result.status === "Success") {
			console.log(`Migration "${result.migrationName}" applied`);
		} else if (result.status === "Error") {
			console.error(`Migration "${result.migrationName}" failed`);
		}
	});

	if (error) {
		console.error("Migration failed:", error);
		throw error;
	}
}
