import { useEffect, useMemo, useState } from "react";
import type {
	ModelKey,
	Project,
	ServiceKey,
	SessionSummary,
	Task,
	WorkflowStep,
} from "@/lib/types";
import type {
	ChatMessage,
	ThinkingState as MessageThinkingState,
} from "../-components/types";
import { useSessionActions } from "./use-session-actions";
import { useSessionApi } from "./use-session-api";
import { useSessionEvents } from "./use-session-events";
import { useSessionMessages } from "./use-session-messages";
import { useSessionModals } from "./use-session-modals";
import { useSessionStatus } from "./use-session-status";
import { useSessionStreaming } from "./use-session-streaming";

interface ActiveTool {
	toolId: string;
	toolName: string;
	startedAt: number;
}

interface UseWorkflowSessionOptions {
	task: Task | undefined;
	project: Project | undefined;
	step: WorkflowStep;
	service: ServiceKey;
	model: ModelKey;
	routeSessionId?: string;
}

interface UseWorkflowSessionReturn {
	sessionId: string | null;
	header: {
		hasSession: boolean;
		onShowHistory: () => void;
	};
	stoppedBanner: {
		isVisible: boolean;
		onResume: () => void;
		onNewSession: () => void;
	};
	messageList: {
		messages: ChatMessage[];
		isLoading: boolean;
		isThinking: boolean;
		showSessionModal: boolean;
		thinking: MessageThinkingState | null;
		activeTools: ActiveTool[];
	};
	chatInput: {
		isThinking: boolean;
		isStopped: boolean;
		disabled: boolean;
		onStop: () => void;
		sendMessage: (content: string) => Promise<void>;
	};
	modals: {
		sessionChoice: {
			isOpen: boolean;
			onClose: () => void;
			sessions: SessionSummary[];
			onContinueSession: (sessionId: string) => void;
			onStartNewSession: () => void;
		};
		history: {
			isOpen: boolean;
			onClose: () => void;
			sessions: SessionSummary[];
			onSelectSession: (sessionId: string) => void;
		};
	};
}

export function useWorkflowSession({
	task,
	project,
	step,
	service,
	model,
	routeSessionId,
}: UseWorkflowSessionOptions): UseWorkflowSessionReturn {
	const [sessionId, setSessionId] = useState<string | null>(null);
	const [initializedScope, setInitializedScope] = useState<string | null>(null);
	const messageState = useSessionMessages();
	const status = useSessionStatus();
	const modals = useSessionModals();
	const api = useSessionApi();
	const streaming = useSessionStreaming();

	const {
		startNewSession,
		checkExistingSessions,
		loadSession,
		sendMessage,
		stopSession,
		resumeSession,
		handleShowHistory,
	} = useSessionActions({
		task,
		project,
		step,
		service,
		model,
		sessionId,
		setSessionId,
		messages: messageState,
		status,
		modals,
		api,
	});

	useSessionEvents({
		sessionId,
		onStatusChanged: (s, stopRequested) => {
			if (stopRequested || s === "stopped" || s === "paused") {
				status.markStopped();
				return;
			}
			status.markResumed();
		},
		onNewMessage: () => {
			if (!sessionId) return;
			api
				.fetchMessages(sessionId, service)
				.then((msgs) => {
					messageState.setMessagesFromDb(msgs);
					streaming.clearAll();
				})
				.catch(() => {});
		},
		onStopped: status.markStopped,
		onThinking: (event) => {
			streaming.updateThinking(event.content, event.isActive);
		},
		onToolProgress: (event) => {
			if (!event.isActive) {
				streaming.clearToolProgress(event.toolUseId);
				return;
			}
			streaming.updateToolProgress({
				toolName: event.toolName,
				toolUseId: event.toolUseId,
				startedAt: Date.now() - event.elapsedSeconds * 1000,
			});
		},
		onConnectionError: () => {
			streaming.clearAll();
		},
	});

	const scopeKey = useMemo(() => {
		if (!task) return null;
		const base = `${task.id}:${task.project_id}:${step}:${service}`;
		if (routeSessionId) return `${base}:session:${routeSessionId}`;
		return `${base}:model:${model}`;
	}, [task, step, service, model, routeSessionId]);

	useEffect(() => {
		if (!task || !project || !scopeKey) return;
		if (initializedScope === scopeKey) return;

		setInitializedScope(scopeKey);

		if (routeSessionId) {
			void loadSession(routeSessionId);
			return;
		}

		void checkExistingSessions();
	}, [
		checkExistingSessions,
		initializedScope,
		loadSession,
		project,
		routeSessionId,
		scopeKey,
		task,
	]);

	const thinkingState = useMemo<MessageThinkingState | null>(() => {
		if (!streaming.thinking.isActive && !streaming.thinking.content)
			return null;
		return {
			sessionId: sessionId ?? "",
			status: streaming.thinking.isActive ? "delta" : "completed",
			content: streaming.thinking.content,
		};
	}, [streaming.thinking, sessionId]);

	const activeTools = useMemo<ActiveTool[]>(() => {
		return Array.from(streaming.activeTools.values()).map((tool) => ({
			toolId: tool.toolUseId,
			toolName: tool.toolName,
			startedAt: tool.startedAt,
		}));
	}, [streaming.activeTools]);

	const header = {
		hasSession: Boolean(sessionId),
		onShowHistory: () => {
			void handleShowHistory();
		},
	};

	const stoppedBanner = {
		isVisible: status.isStopped,
		onResume: () => {
			void resumeSession();
		},
		onNewSession: () => {
			void startNewSession();
		},
	};

	const messageList = {
		messages: messageState.messages,
		isLoading: status.isLoading,
		isThinking: status.isThinking,
		showSessionModal: modals.showSessionModal,
		thinking: thinkingState,
		activeTools,
	};

	const chatInput = {
		isThinking: status.isThinking,
		isStopped: status.isStopped,
		disabled: !sessionId || status.isLoading,
		onStop: () => {
			void stopSession();
		},
		sendMessage,
	};

	const sessionChoiceModal = {
		isOpen: modals.showSessionModal,
		onClose: () => modals.setShowSessionModal(false),
		sessions: modals.existingSessions,
		onContinueSession: (targetSessionId: string) => {
			void loadSession(targetSessionId);
		},
		onStartNewSession: () => {
			void startNewSession();
		},
	};

	const sessionHistoryModal = {
		isOpen: modals.showHistory,
		onClose: () => modals.setShowHistory(false),
		sessions: modals.existingSessions,
		onSelectSession: (targetSessionId: string) => {
			void loadSession(targetSessionId);
		},
	};

	return {
		sessionId,
		header,
		stoppedBanner,
		messageList,
		chatInput,
		modals: {
			sessionChoice: sessionChoiceModal,
			history: sessionHistoryModal,
		},
	};
}
