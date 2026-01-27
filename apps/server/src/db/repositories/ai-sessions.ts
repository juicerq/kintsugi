import type { Kysely } from "kysely";
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
			return await db
				.updateTable("ai_sessions")
				.set(data)
				.where("id", "=", sessionId)
				.returningAll()
				.executeTakeFirst();
		},

		async setStopRequested(sessionId: string, value: number) {
			return await db
				.updateTable("ai_sessions")
				.set({ stop_requested: value })
				.where("id", "=", sessionId)
				.returningAll()
				.executeTakeFirst();
		},
	};
}
