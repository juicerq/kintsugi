import type { Kysely } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
	await db.schema
		.alterTable("ai_sessions")
		.addColumn("status", "text", (col) => col.defaultTo("idle"))
		.execute();

	await db.schema
		.alterTable("ai_sessions")
		.addColumn("stop_requested", "integer", (col) => col.defaultTo(0))
		.execute();

	await db.schema
		.alterTable("ai_sessions")
		.addColumn("last_heartbeat_at", "text")
		.execute();

	await db.schema
		.alterTable("ai_sessions")
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
}
