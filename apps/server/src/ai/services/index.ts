import { ClaudeCodeClient } from "./claude-code";
import { OpenCodeClient } from "./opencode";

export const servicesMap = {
	claude: ClaudeCodeClient,
	opencode: OpenCodeClient,
} as const;
