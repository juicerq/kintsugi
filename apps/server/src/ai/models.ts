import type { AiServiceName } from "./types";

export const modelsMap = {
	"opus-4.5": {
		claude: "claude-opus-4-5",
		opencode: "anthropic/claude-opus-4-5",
	},
	"sonnet-4.5": {
		claude: "claude-sonnet-4-5",
		opencode: "anthropic/claude-sonnet-4-5",
	},
	"haiku-4.5": {
		claude: "claude-haiku-4-5",
		opencode: "anthropic/claude-haiku-4-5",
	},
	"gpt-5.2-codex": {
		claude: "gpt-5.2-codex",
		opencode: "openai/gpt-5.2-codex",
	},
} as const satisfies Record<string, Record<AiServiceName, string>>;

export type ModelKey = keyof typeof modelsMap;

export const modelKeys = Object.keys(modelsMap) as ModelKey[];

export function getModelId(modelKey: ModelKey, service: AiServiceName): string {
	return modelsMap[modelKey][service];
}
