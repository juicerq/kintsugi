import { useState } from "react";

export interface ThinkingState {
	content: string;
	isActive: boolean;
}

export interface ToolInfo {
	toolName: string;
	toolUseId: string;
	startedAt: number;
}

export interface StreamingState {
	thinking: ThinkingState;
	activeTools: Map<string, ToolInfo>;
}

export function useSessionStreaming() {
	const [thinking, setThinking] = useState<ThinkingState>({
		content: "",
		isActive: false,
	});
	const [activeTools, setActiveTools] = useState<Map<string, ToolInfo>>(
		() => new Map(),
	);

	const updateThinking = (content: string, isActive: boolean) => {
		setThinking({ content, isActive });
	};

	const updateToolProgress = (tool: ToolInfo) => {
		setActiveTools((prev) => {
			const next = new Map(prev);
			next.set(tool.toolUseId, tool);
			return next;
		});
	};

	const clearToolProgress = (toolUseId: string) => {
		setActiveTools((prev) => {
			const next = new Map(prev);
			next.delete(toolUseId);
			return next;
		});
	};

	const clearAll = () => {
		setThinking({ content: "", isActive: false });
		setActiveTools(new Map());
	};

	return {
		thinking,
		activeTools,
		updateThinking,
		updateToolProgress,
		clearToolProgress,
		clearAll,
	};
}

export type SessionStreaming = ReturnType<typeof useSessionStreaming>;
