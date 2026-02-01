import { BookOpen, Lightbulb, Search } from "lucide-react";
import type { ModelKey, ServiceKey, WorkflowStep } from "./types";

// Claude Code models (all except GPT 5.2 Codex)
export const modelOptionsClaude: {
	key: ModelKey;
	label: string;
	dotColor: string;
}[] = [
	{ key: "opus-4.5", label: "Opus 4.5", dotColor: "bg-red-500" },
	{ key: "sonnet-4.5", label: "Sonnet 4.5", dotColor: "bg-red-500" },
	{ key: "haiku-4.5", label: "Haiku 4.5", dotColor: "bg-red-500" },
];

// OpenCode models (all 5 models)
export const modelOptionsOpencode: {
	key: ModelKey;
	label: string;
	dotColor: string;
}[] = [
	{ key: "opus-4.5", label: "Opus 4.5", dotColor: "bg-red-500" },
	{ key: "sonnet-4.5", label: "Sonnet 4.5", dotColor: "bg-red-500" },
	{ key: "haiku-4.5", label: "Haiku 4.5", dotColor: "bg-red-500" },
	{ key: "gpt-5.2-codex", label: "GPT 5.2 Codex", dotColor: "bg-white" },
	{ key: "kimi-k2.5-free", label: "Kimi K2.5", dotColor: "bg-blue-500" },
];

// All models for backward compatibility
export const modelOptions = modelOptionsOpencode;

export const workflowSteps: {
	key: WorkflowStep;
	label: string;
	icon: typeof Lightbulb;
	variant: "violet" | "amber" | "emerald";
}[] = [
	{
		key: "brainstorm",
		label: "Brainstorm",
		icon: Lightbulb,
		variant: "violet",
	},
	{
		key: "architecture",
		label: "Architecture",
		icon: BookOpen,
		variant: "amber",
	},
	{ key: "review", label: "Review", icon: Search, variant: "emerald" },
];

export const serviceOptions: {
	key: ServiceKey;
	label: string;
	dotColor: string;
}[] = [
	{ key: "claude", label: "Claude", dotColor: "bg-orange-500" },
	{ key: "opencode", label: "OpenCode", dotColor: "bg-blue-500" },
];
