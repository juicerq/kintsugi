import type { RouterOutputs } from "@kintsugi/shared";

export type Subtask = RouterOutputs["subtasks"]["list"][number];

export type SubtaskCategory = NonNullable<Subtask["category"]>;
export type SubtaskStatus = NonNullable<Subtask["status"]>;

export const categories: SubtaskCategory[] = [
	"code",
	"test",
	"docs",
	"fix",
	"refactor",
];
