import type { Generated } from "kysely";

export interface ProjectTable {
	id: string;
	name: string;
	path: string;
	description: string | null;
	created_at: Generated<string>;
}

export interface TaskTable {
	id: string;
	project_id: string;
	title: string;
	description: string | null;
	branch_name: string | null;
	brainstorm: string | null;
	architecture: string | null;
	review: string | null;
	created_at: Generated<string>;
	completed_at: string | null;
}

export type SubtaskCategory = "code" | "test" | "docs" | "fix" | "refactor";
export type SubtaskStatus = "waiting" | "in_progress" | "completed";

export interface SubtaskTable {
	id: string;
	task_id: string;
	name: string;
	acceptance_criterias: string | null; // JSON array
	out_of_scope: string | null; // JSON array
	category: SubtaskCategory | null;
	status: Generated<SubtaskStatus>;
	started_at: string | null;
	finished_at: string | null;
	should_commit: Generated<number>; // 0 or 1, treated as boolean
	key_decisions: string | null; // JSON array
	files: string | null; // JSON array
	steps: string | null; // JSON array
	notes: string | null;
}

export interface AiSessionTable {
	id: string;
	service: string;
	title: string | null;
	model: string | null;
	scope_project_id: string | null;
	scope_repo_path: string | null;
	scope_workspace_id: string | null;
	scope_label: string | null;
	metadata: string | null;
	status: string | null;
	stop_requested: Generated<number>;
	last_heartbeat_at: string | null;
	last_error: string | null;
	created_at: Generated<string>;
}

export interface AiMessageTable {
	id: string;
	session_id: string;
	role: string;
	content: string;
	metadata: string | null;
	raw: string | null;
	created_at: Generated<string>;
}

export interface Database {
	projects: ProjectTable;
	tasks: TaskTable;
	subtasks: SubtaskTable;
	ai_sessions: AiSessionTable;
	ai_messages: AiMessageTable;
}
