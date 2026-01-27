import { type Kysely, sql } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
	await db.schema
		.createTable("ai_sessions")
		.addColumn("id", "text", (col) => col.primaryKey())
		.addColumn("service", "text", (col) => col.notNull())
		.addColumn("title", "text")
		.addColumn("model", "text")
		.addColumn("scope_project_id", "text")
		.addColumn("scope_repo_path", "text")
		.addColumn("scope_workspace_id", "text")
		.addColumn("scope_label", "text")
		.addColumn("metadata", "text")
		.addColumn("created_at", "text", (col) =>
			col.defaultTo(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
		)
		.execute();

	await db.schema
		.createTable("ai_messages")
		.addColumn("id", "text", (col) => col.primaryKey())
		.addColumn("session_id", "text", (col) =>
			col.notNull().references("ai_sessions.id").onDelete("cascade"),
		)
		.addColumn("role", "text", (col) => col.notNull())
		.addColumn("content", "text", (col) => col.notNull())
		.addColumn("metadata", "text")
		.addColumn("raw", "text")
		.addColumn("created_at", "text", (col) =>
			col.defaultTo(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
		)
		.execute();

	await db.schema
		.createIndex("idx_ai_sessions_service")
		.on("ai_sessions")
		.column("service")
		.execute();

	await db.schema
		.createIndex("idx_ai_sessions_created_at")
		.on("ai_sessions")
		.column("created_at")
		.execute();

	await db.schema
		.createIndex("idx_ai_sessions_scope_project_id")
		.on("ai_sessions")
		.column("scope_project_id")
		.execute();

	await db.schema
		.createIndex("idx_ai_sessions_scope_repo_path")
		.on("ai_sessions")
		.column("scope_repo_path")
		.execute();

	await db.schema
		.createIndex("idx_ai_sessions_scope_workspace_id")
		.on("ai_sessions")
		.column("scope_workspace_id")
		.execute();

	await db.schema
		.createIndex("idx_ai_sessions_scope_label")
		.on("ai_sessions")
		.column("scope_label")
		.execute();

	await db.schema
		.createIndex("idx_ai_messages_session_id")
		.on("ai_messages")
		.column("session_id")
		.execute();

	await db.schema
		.createIndex("idx_ai_messages_created_at")
		.on("ai_messages")
		.column("created_at")
		.execute();
}
