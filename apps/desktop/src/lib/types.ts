import type { RouterOutputs } from "@kintsugi/shared";

export type WorkflowStep = "brainstorm" | "architecture" | "review";

export type ModelKey = "opus-4.5" | "sonnet-4.5" | "haiku-4.5" | "gpt-5.2-codex";

/** Single task (from tasks.get) */
export type Task = NonNullable<RouterOutputs["tasks"]["get"]>;

/** Task with subtask counts (from tasks.list) */
export type TaskListItem = RouterOutputs["tasks"]["list"][number];

/** Project (from projects.list) */
export type Project = RouterOutputs["projects"]["list"][number];
