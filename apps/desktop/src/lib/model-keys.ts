import { modelOptions } from "./consts";
import type { ModelKey } from "./types";

const modelKeySet = new Set(modelOptions.map((model) => model.key));

export function resolveModelKey(
	value: string | null | undefined,
): ModelKey | null {
	if (!value) return null;

	if (modelKeySet.has(value as ModelKey)) return value as ModelKey;

	return null;
}
