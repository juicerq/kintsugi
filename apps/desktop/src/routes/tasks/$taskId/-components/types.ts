import type { RouterOutputs } from "@kintsugi/shared";

export type Subtask = RouterOutputs["subtasks"]["list"][number];

export type SubtaskCategory = "code" | "test" | "docs" | "fix" | "refactor";
export type SubtaskStatus = "waiting" | "in_progress" | "completed";
