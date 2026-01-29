import { useEffect, useRef, useState } from "react";
import type {
	ModelKey,
	Project,
	SessionSummary,
	Task,
	WorkflowStep,
} from "@/lib/types";
import { trpc } from "../../../../trpc";
import { buildInitialPrompt } from "../-components/build-prompt";
import type { ChatMessage } from "../-components/types";
import { useSessionEvents } from "./use-session-events";

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

type DbMessage = {
	id: string;
	role: string;
	content: string;
};

function mapDbMessageToChatMessage(msg: DbMessage): ChatMessage {
	return {
		id: msg.id,
		role: msg.role as "user" | "assistant",
		content: msg.content,
	};
}

function getErrorMessage(err: unknown, fallback: string): string {
	return err instanceof Error ? err.message : fallback;
}

// ═══════════════════════════════════════════════════════════════
// Mini-Hook: Messages
// ═══════════════════════════════════════════════════════════════

function useSessionMessages() {
	const [messages, setMessages] = useState<ChatMessage[]>([]);

	function appendUserMessage(content: string): string {
		const id = crypto.randomUUID();
		setMessages((prev) => [...prev, { id, role: "user", content }]);
		return id;
	}

	function appendAssistantMessage(id: string, content: string) {
		setMessages((prev) => [...prev, { id, role: "assistant", content }]);
	}

	function appendError(message: string) {
		setMessages((prev) => [
			...prev,
			{ id: crypto.randomUUID(), role: "error", content: message },
		]);
	}

	function setMessagesFromDb(dbMessages: DbMessage[]) {
		setMessages(dbMessages.map(mapDbMessageToChatMessage));
	}

	return {
		messages,
		appendUserMessage,
		appendAssistantMessage,
		appendError,
		setMessagesFromDb,
	};
}

// ═══════════════════════════════════════════════════════════════
// Mini-Hook: Status
// ═══════════════════════════════════════════════════════════════

function useSessionStatus() {
	const [isLoading, setIsLoading] = useState(true);
	const [isThinking, setIsThinking] = useState(false);
	const [isStopped, setIsStopped] = useState(false);

	function startThinking() {
		setIsThinking(true);
		setIsStopped(false);
	}

	function stopThinking() {
		setIsThinking(false);
	}

	function markStopped() {
		setIsStopped(true);
		setIsThinking(false);
	}

	function markResumed() {
		setIsStopped(false);
	}

	return {
		isLoading,
		isThinking,
		isStopped,
		setLoading: setIsLoading,
		startThinking,
		stopThinking,
		markStopped,
		markResumed,
	};
}

// ═══════════════════════════════════════════════════════════════
// Mini-Hook: Modals
// ═══════════════════════════════════════════════════════════════

function useSessionModals() {
	const [showSessionModal, setShowSessionModal] = useState(false);
	const [showHistory, setShowHistory] = useState(false);
	const [existingSessions, setExistingSessions] = useState<SessionSummary[]>(
		[],
	);

	function closeAll() {
		setShowSessionModal(false);
		setShowHistory(false);
	}

	return {
		showSessionModal,
		setShowSessionModal,
		showHistory,
		setShowHistory,
		existingSessions,
		setExistingSessions,
		closeAll,
	};
}

// ═══════════════════════════════════════════════════════════════
// Mini-Hook: API
// ═══════════════════════════════════════════════════════════════

function useSessionApi() {
	const utils = trpc.useUtils();
	const createMutation = trpc.ai.sessions.create.useMutation();
	const sendMutation = trpc.ai.messages.send.useMutation();
	const stopMutation = trpc.ai.sessions.stop.useMutation();
	const resumeMutation = trpc.ai.sessions.resume.useMutation();

	async function createSession(opts: {
		modelKey: ModelKey;
		title: string;
		scope: { projectId: string; label: string };
	}) {
		return createMutation.mutateAsync({
			service: "claude",
			...opts,
		});
	}

	async function sendMessage(sessionId: string, content: string) {
		return sendMutation.mutateAsync({
			service: "claude",
			sessionId,
			content,
		});
	}

	async function stopSession(sessionId: string) {
		await stopMutation.mutateAsync({
			service: "claude",
			sessionId,
		});
	}

	async function resumeSession(sessionId: string) {
		await resumeMutation.mutateAsync({
			service: "claude",
			sessionId,
		});
	}

	async function fetchSession(sessionId: string) {
		return utils.ai.sessions.get.fetch({
			service: "claude",
			sessionId,
		});
	}

	async function fetchMessages(sessionId: string) {
		const msgs = await utils.ai.messages.list.fetch({
			service: "claude",
			sessionId,
		});
		return msgs ?? [];
	}

	async function fetchSessionsByScope(
		scope: { projectId: string; label: string },
		limit = 10,
	) {
		const sessions = await utils.ai.sessions.listByScope.fetch({
			service: "claude",
			scope,
			limit,
		});
		return (sessions ?? []) as SessionSummary[];
	}

	return {
		createSession,
		sendMessage,
		stopSession,
		resumeSession,
		fetchSession,
		fetchMessages,
		fetchSessionsByScope,
	};
}

// ═══════════════════════════════════════════════════════════════
// Types: Main Hook
// ═══════════════════════════════════════════════════════════════

interface UseWorkflowSessionOptions {
	task: Task | undefined;
	project: Project | undefined;
	step: WorkflowStep;
	model: ModelKey;
	routeSessionId?: string;
}

interface UseWorkflowSessionReturn {
	sessionId: string | null;
	messages: ChatMessage[];
	isLoading: boolean;
	isThinking: boolean;
	isStopped: boolean;
	existingSessions: SessionSummary[];
	showSessionModal: boolean;
	setShowSessionModal: (value: boolean) => void;
	showHistory: boolean;
	setShowHistory: (value: boolean) => void;
	startNewSession: () => Promise<void>;
	loadSession: (id: string) => Promise<void>;
	sendMessage: (content: string) => Promise<void>;
	stopSession: () => Promise<void>;
	resumeSession: () => Promise<void>;
	handleShowHistory: () => Promise<void>;
}

// ═══════════════════════════════════════════════════════════════
// Main Hook: Workflow Session
// ═══════════════════════════════════════════════════════════════

export function useWorkflowSession({
	task,
	project,
	step,
	model,
	routeSessionId,
}: UseWorkflowSessionOptions): UseWorkflowSessionReturn {
	// ─── Compose Mini-Hooks ───
	const [sessionId, setSessionId] = useState<string | null>(null);
	const msg = useSessionMessages();
	const status = useSessionStatus();
	const modals = useSessionModals();
	const api = useSessionApi();
	const initialized = useRef(false);

	// ─── Event Subscription ───
	useSessionEvents({
		sessionId,
		onStatusChanged: (s, stopRequested) => {
			if (stopRequested || s === "stopped" || s === "paused") {
				status.markStopped();
			} else {
				status.markResumed();
			}
		},
		onNewMessage: () => {
			if (!sessionId) return;
			api
				.fetchMessages(sessionId)
				.then(msg.setMessagesFromDb)
				.catch(() => {});
		},
		onStopped: status.markStopped,
	});

	// ─── Actions: Session Lifecycle ───
	async function checkExistingSessions() {
		if (!task) return;

		status.setLoading(true);
		try {
			const sessions = await api.fetchSessionsByScope({
				projectId: task.project_id,
				label: `${step}:${task.id}`,
			});

			if (sessions.length > 0) {
				modals.setExistingSessions(sessions);
				modals.setShowSessionModal(true);
			} else {
				await startNewSession();
			}
		} catch (err) {
			msg.appendError(getErrorMessage(err, "Failed to initialize session"));
		} finally {
			status.setLoading(false);
		}
	}

	async function startNewSession() {
		if (!task || !project) return;

		status.startThinking();
		status.setLoading(false);
		modals.closeAll();

		try {
			const session = await api.createSession({
				modelKey: model,
				title: `${step}: ${task.title}`,
				scope: { projectId: task.project_id, label: `${step}:${task.id}` },
			});

			setSessionId(session.id);

			const prompt = buildInitialPrompt(step, task, project);
			msg.appendUserMessage(prompt);

			const response = await api.sendMessage(session.id, prompt);
			msg.appendAssistantMessage(response.id, response.content);
		} catch (err) {
			msg.appendError(getErrorMessage(err, "Failed to create session"));
		} finally {
			status.stopThinking();
		}
	}

	async function loadSession(targetSessionId: string) {
		modals.closeAll();
		setSessionId(targetSessionId);
		status.setLoading(true);
		status.markResumed();

		try {
			const session = await api.fetchSession(targetSessionId);

			if (
				session?.stopRequested ||
				session?.status === "stopped" ||
				session?.status === "paused"
			) {
				status.markStopped();
			}

			const msgs = await api.fetchMessages(targetSessionId);
			msg.setMessagesFromDb(msgs);
		} catch (err) {
			msg.appendError(getErrorMessage(err, "Failed to load session"));
		} finally {
			status.setLoading(false);
		}
	}

	// ─── Actions: Messaging ───
	async function sendMessage(content: string) {
		if (!content.trim() || !sessionId || status.isThinking || status.isStopped)
			return;

		msg.appendUserMessage(content);
		status.startThinking();

		try {
			const response = await api.sendMessage(sessionId, content);
			msg.appendAssistantMessage(response.id, response.content);
		} catch (err) {
			const errorMsg = getErrorMessage(err, "Failed to send message");

			if (errorMsg.includes("stopped") || errorMsg.includes("paused")) {
				try {
					const session = await api.fetchSession(sessionId);
					if (
						session?.stopRequested ||
						session?.status === "stopped" ||
						session?.status === "paused"
					) {
						status.markStopped();
					}
				} catch {
					status.markStopped();
				}
			}

			msg.appendError(errorMsg);
		} finally {
			status.stopThinking();
		}
	}

	// ─── Actions: Session Control ───
	async function stopSession() {
		if (!sessionId) return;

		try {
			await api.stopSession(sessionId);
			status.markStopped();
		} catch (err) {
			msg.appendError(getErrorMessage(err, "Failed to stop session"));
		}
	}

	async function resumeSession() {
		if (!sessionId) return;

		try {
			await api.resumeSession(sessionId);
			status.markResumed();
		} catch (err) {
			msg.appendError(getErrorMessage(err, "Failed to resume session"));
		}
	}

	async function handleShowHistory() {
		if (!task) return;

		try {
			const sessions = await api.fetchSessionsByScope({
				projectId: task.project_id,
				label: `${step}:${task.id}`,
			});
			modals.setExistingSessions(sessions);
		} catch {
			// Use whatever we already have
		}
		modals.setShowHistory(true);
	}

	// ─── Initialization ───
	useEffect(() => {
		if (initialized.current || !task || !project) return;
		initialized.current = true;

		if (routeSessionId) {
			loadSession(routeSessionId);
			return;
		}

		checkExistingSessions();
	}, [task, project, step, routeSessionId]);

	// ─── Return ───
	return {
		sessionId,
		messages: msg.messages,
		existingSessions: modals.existingSessions,
		isLoading: status.isLoading,
		isThinking: status.isThinking,
		isStopped: status.isStopped,
		showSessionModal: modals.showSessionModal,
		setShowSessionModal: modals.setShowSessionModal,
		showHistory: modals.showHistory,
		setShowHistory: modals.setShowHistory,
		startNewSession,
		loadSession,
		sendMessage,
		stopSession,
		resumeSession,
		handleShowHistory,
	};
}
