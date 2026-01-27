import { BookOpen, Lightbulb, Search } from "lucide-react";
import type { ModelKey, WorkflowStep } from "./types";

export const modelOptions: { key: ModelKey; label: string; dotColor: string }[] = [
	{ key: "opus-4.5", label: "Opus 4.5", dotColor: "bg-red-500" },
	{ key: "sonnet-4.5", label: "Sonnet 4.5", dotColor: "bg-red-500" },
	{ key: "haiku-4.5", label: "Haiku 4.5", dotColor: "bg-red-500" },
	{ key: "gpt-5.2-codex", label: "GPT 5.2 Codex", dotColor: "bg-white" },
];

export const workflowSteps: {
	key: WorkflowStep;
	label: string;
	icon: typeof Lightbulb;
	variant: "violet" | "amber" | "emerald";
}[] = [
	{ key: "brainstorm", label: "Brainstorm", icon: Lightbulb, variant: "violet" },
	{ key: "architecture", label: "Architecture", icon: BookOpen, variant: "amber" },
	{ key: "review", label: "Review", icon: Search, variant: "emerald" },
];
