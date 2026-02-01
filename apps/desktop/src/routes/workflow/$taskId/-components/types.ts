export type ChatMessage = {
	id: string;
	role: "user" | "assistant" | "error";
	content: string;
	thinking?: string[]; // Extracted from raw SDK response for persistence
};

export type ThinkingState = {
	sessionId: string;
	status: "delta" | "completed"; // "started" removed - never used
	content: string;
};

export type ToolProgressState = {
	sessionId: string;
	toolName: string;
	toolId: string;
	status: "running" | "completed" | "error";
	message?: string;
};
