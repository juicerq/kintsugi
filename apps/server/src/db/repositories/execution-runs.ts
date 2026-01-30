import type { Kysely } from "kysely";
import type { Database, ExecutionRunTable } from "../types";

type ExecutionRunCreateData = Omit<ExecutionRunTable, "started_at">;
type ExecutionRunUpdateData = Partial<
	Pick<
		ExecutionRunTable,
		| "status"
		| "current_subtask_id"
		| "current_session_id"
		| "error"
		| "finished_at"
	>
>;

export function createExecutionRunsRepository(db: Kysely<Database>) {
	return {
		async create(data: ExecutionRunCreateData) {
			return await db
				.insertInto("execution_runs")
				.values(data)
				.returningAll()
				.executeTakeFirstOrThrow();
		},

		async findActiveByTask(taskId: string) {
			return await db
				.selectFrom("execution_runs")
				.where("task_id", "=", taskId)
				.where("status", "in", ["running", "stopping"])
				.selectAll()
				.executeTakeFirst();
		},

		async update(id: string, data: ExecutionRunUpdateData) {
			return await db
				.updateTable("execution_runs")
				.set(data)
				.where("id", "=", id)
				.execute();
		},
	};
}
