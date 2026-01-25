import { type Kysely, sql } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
	await db.schema
		.alterTable("ai_sessions")
		.addColumn("status", "text", (col) => col.defaultTo("idle"))
		.addColumn("stop_requested", "integer", (col) => col.defaultTo(0))
		.addColumn("last_heartbeat_at", "text")
		.addColumn("last_error", "text")
		.execute();

	await db.schema
		.createIndex("idx_ai_sessions_status")
		.on("ai_sessions")
		.column("status")
		.execute();

	await db.schema
		.createIndex("idx_ai_sessions_last_heartbeat")
		.on("ai_sessions")
		.column("last_heartbeat_at")
		.execute();

	await db
		.updateTable("ai_sessions")
		.set({
			status: sql`COALESCE(status, 'idle')`,
			stop_requested: sql`COALESCE(stop_requested, 0)`,
		})
		.execute();
}
