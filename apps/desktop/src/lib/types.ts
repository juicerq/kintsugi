import type { RouterOutputs } from "@kintsugi/shared";

export type WorkflowStep = "brainstorm" | "architecture" | "review";

export type ServiceKey = "claude" | "opencode";

export type ModelKey =
	| "opus-4.5"
	| "sonnet-4.5"
	| "haiku-4.5"
	| "gpt-5.2-codex";

/** Single task (from tasks.get) */
export type Task = NonNullable<RouterOutputs["tasks"]["get"]>;

/** Task with subtask counts (from tasks.list) */
export type TaskListItem = RouterOutputs["tasks"]["list"][number];

/** Project (from projects.list) */
export type Project = RouterOutputs["projects"]["list"][number];

/** Project with tasks for sidebar (from projects.listWithTasks) */
export type SidebarProject = RouterOutputs["projects"]["listWithTasks"][number];

/** Task item within a sidebar project */
export type SidebarTask = SidebarProject["tasks"][number];

/** AI session summary returned by listByScope */
export type SessionSummary = {
	id: string;
	title: string | null;
	model: string | null;
	created_at: string;
	status: string | null;
	stop_requested: number;
	message_count: number;
	last_message_preview: string | null;
	last_message_role: string | null;
};
