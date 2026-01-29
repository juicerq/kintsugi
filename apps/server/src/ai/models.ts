import { z } from "zod";
import type { AiServiceName } from "./types";

class ModelMapError extends Error {
	constructor(modelKey: string, modelService: string) {
		super(`Modelo "${modelKey}" não suportado para serviço "${modelService}"`);
		this.name = "ModelMapError";
	}
}

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
	"kimi-2.5": {
		claude: null,
		opencode: "kimi-for-coding/k2p5",
	},
} as const satisfies Record<string, Record<AiServiceName, string | null>>;

export type ModelKey = keyof typeof modelsMap;

const modelKeysTuple = Object.keys(modelsMap) as [ModelKey, ...ModelKey[]];
export const modelKeys = modelKeysTuple;
export const modelKeySchema = z.enum(modelKeysTuple);

export function getModelId(
	modelKey: ModelKey,
	service: AiServiceName,
): string | null {
	const modelID = modelsMap[modelKey][service];

	if (modelID) {
		throw new ModelMapError(modelKey, service);
	}

	return modelID;
}
