import type { Kysely } from "kysely";
import type { Database } from "../types";

export function createAiMessagesRepository(db: Kysely<Database>) {
	return {
		async create(data: {
			id: string;
			session_id: string;
			role: string;
			content: string;
			metadata?: string | null;
			raw?: string | null;
		}) {
			return await db
				.insertInto("ai_messages")
				.values({
					id: data.id,
					session_id: data.session_id,
					role: data.role,
					content: data.content,
					metadata: data.metadata ?? null,
					raw: data.raw ?? null,
				})
				.returningAll()
				.executeTakeFirstOrThrow();
		},

		async listBySession(sessionId: string, limit?: number) {
			let query = db
				.selectFrom("ai_messages")
				.where("session_id", "=", sessionId)
				.orderBy("created_at", "asc");

			if (limit) {
				query = query.limit(limit);
			}

			return await query.selectAll().execute();
		},

		async countBySession(sessionId: string) {
			const result = await db
				.selectFrom("ai_messages")
				.where("session_id", "=", sessionId)
				.select(db.fn.count("id").as("count"))
				.executeTakeFirst();

			return Number(result?.count ?? 0);
		},
	};
}
