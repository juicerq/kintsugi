import type { Kysely } from "kysely";
import { uiEventBus } from "../../events/bus";
import type { Database } from "../types";

type AiSessionScopeColumns = {
	scope_project_id?: string | null;
	scope_repo_path?: string | null;
	scope_workspace_id?: string | null;
	scope_label?: string | null;
};

export function createAiSessionsRepository(db: Kysely<Database>) {
	return {
		async create(data: {
			id: string;
			service: string;
			title?: string | null;
			model?: string | null;
			scope_project_id?: string | null;
			scope_repo_path?: string | null;
			scope_workspace_id?: string | null;
			scope_label?: string | null;
			metadata?: string | null;
			status?: string | null;
			stop_requested?: number;
			last_heartbeat_at?: string | null;
			last_error?: string | null;
		}) {
			return await db
				.insertInto("ai_sessions")
				.values({
					id: data.id,
					service: data.service,
					title: data.title ?? null,
					model: data.model ?? null,
					scope_project_id: data.scope_project_id ?? null,
					scope_repo_path: data.scope_repo_path ?? null,
					scope_workspace_id: data.scope_workspace_id ?? null,
					scope_label: data.scope_label ?? null,
					metadata: data.metadata ?? null,
					status: data.status ?? null,
					stop_requested: data.stop_requested ?? 0,
					last_heartbeat_at: data.last_heartbeat_at ?? null,
					last_error: data.last_error ?? null,
				})
				.returningAll()
				.executeTakeFirstOrThrow();
		},

		async findById(id: string) {
			return await db
				.selectFrom("ai_sessions")
				.where("id", "=", id)
				.selectAll()
				.executeTakeFirst();
		},

		async list(input?: {
			service?: string;
			scope?: AiSessionScopeColumns;
			limit?: number;
		}) {
			let query = db.selectFrom("ai_sessions");

			if (input?.service) {
				query = query.where("service", "=", input.service);
			}

			if (input?.scope) {
				if (input.scope.scope_project_id !== undefined) {
					query = query.where(
						"scope_project_id",
						"=",
						input.scope.scope_project_id,
					);
				}

				if (input.scope.scope_repo_path !== undefined) {
					query = query.where(
						"scope_repo_path",
						"=",
						input.scope.scope_repo_path,
					);
				}

				if (input.scope.scope_workspace_id !== undefined) {
					query = query.where(
						"scope_workspace_id",
						"=",
						input.scope.scope_workspace_id,
					);
				}

				if (input.scope.scope_label !== undefined) {
					query = query.where("scope_label", "=", input.scope.scope_label);
				}
			}

			query = query.orderBy("created_at", "desc");

			if (input?.limit) {
				query = query.limit(input.limit);
			}

			return await query.selectAll().execute();
		},

		async updateStatus(
			sessionId: string,
			data: {
				status?: string | null;
				stop_requested?: number;
				last_heartbeat_at?: string | null;
				last_error?: string | null;
			},
		) {
			const result = await db
				.updateTable("ai_sessions")
				.set(data)
				.where("id", "=", sessionId)
				.returningAll()
				.executeTakeFirst();

			// Publish event when status-related fields change
			if (
				result &&
				(data.status !== undefined || data.stop_requested !== undefined)
			) {
				uiEventBus.publish({
					type: "session.statusChanged",
					sessionId,
					status: result.status ?? "idle",
					stopRequested: result.stop_requested ?? 0,
				});
			}

			return result;
		},

		async setStopRequested(sessionId: string, value: number) {
			return await db
				.updateTable("ai_sessions")
				.set({ stop_requested: value })
				.where("id", "=", sessionId)
				.returningAll()
				.executeTakeFirst();
		},

		async listWithMessageStats(input?: {
			service?: string;
			scope?: AiSessionScopeColumns;
			limit?: number;
		}) {
			let query = db
				.selectFrom("ai_sessions")
				.leftJoin("ai_messages", "ai_messages.session_id", "ai_sessions.id")
				.select([
					"ai_sessions.id",
					"ai_sessions.service",
					"ai_sessions.title",
					"ai_sessions.model",
					"ai_sessions.created_at",
					"ai_sessions.status",
					"ai_sessions.stop_requested",
					"ai_sessions.last_heartbeat_at",
					"ai_sessions.scope_label",
				])
				.select(db.fn.count("ai_messages.id").as("message_count"))
				.groupBy("ai_sessions.id");

			if (input?.service) {
				query = query.where("ai_sessions.service", "=", input.service);
			}

			if (input?.scope) {
				if (input.scope.scope_project_id !== undefined) {
					query = query.where(
						"ai_sessions.scope_project_id",
						"=",
						input.scope.scope_project_id,
					);
				}

				if (input.scope.scope_label !== undefined) {
					query = query.where(
						"ai_sessions.scope_label",
						"=",
						input.scope.scope_label,
					);
				}
			}

			query = query.orderBy("ai_sessions.created_at", "desc");

			if (input?.limit) {
				query = query.limit(input.limit);
			}

			const sessions = await query.execute();

			// Get last message for each session
			const sessionsWithPreview = await Promise.all(
				sessions.map(async (session) => {
					const lastMessage = await db
						.selectFrom("ai_messages")
						.where("session_id", "=", session.id)
						.orderBy("created_at", "desc")
						.select(["content", "role"])
						.limit(1)
						.executeTakeFirst();

					return {
						...session,
						message_count: Number(session.message_count),
						last_message_preview: lastMessage?.content ?? null,
						last_message_role: lastMessage?.role ?? null,
					};
				}),
			);

			return sessionsWithPreview;
		},
	};
}
