import { useCallback } from "react";
import type {
	ModelKey,
	Project,
	ServiceKey,
	Task,
	WorkflowStep,
} from "@/lib/types";
import { buildInitialPrompt } from "../-components/build-prompt";
import type { SessionApi } from "./use-session-api";
import type { SessionMessages } from "./use-session-messages";
import type { SessionModals } from "./use-session-modals";
import type { SessionStatus } from "./use-session-status";

function getErrorMessage(err: unknown, fallback: string): string {
	return err instanceof Error ? err.message : fallback;
}

interface UseSessionActionsOptions {
	task: Task | undefined;
	project: Project | undefined;
	step: WorkflowStep;
	service: ServiceKey;
	model: ModelKey;
	sessionId: string | null;
	setSessionId: (id: string | null) => void;
	messages: SessionMessages;
	status: SessionStatus;
	modals: SessionModals;
	api: SessionApi;
}

interface UseSessionActionsReturn {
	startNewSession: () => Promise<void>;
	checkExistingSessions: () => Promise<void>;
	loadSession: (id: string) => Promise<void>;
	sendMessage: (content: string) => Promise<void>;
	stopSession: () => Promise<void>;
	resumeSession: () => Promise<void>;
	handleShowHistory: () => Promise<void>;
}

export function useSessionActions({
	task,
	project,
	step,
	service,
	model,
	sessionId,
	setSessionId,
	messages,
	status,
	modals,
	api,
}: UseSessionActionsOptions): UseSessionActionsReturn {
	const {
		appendUserMessage,
		appendAssistantMessage,
		appendError,
		setMessagesFromDb,
	} = messages;
	const {
		isThinking,
		isStopped,
		setLoading,
		startThinking,
		stopThinking,
		markStopped,
		markResumed,
	} = status;
	const { setExistingSessions, setShowSessionModal, setShowHistory, closeAll } =
		modals;
	const {
		createSession,
		sendMessage: sendSessionMessage,
		stopSession: stopSessionApi,
		resumeSession: resumeSessionApi,
		fetchSession,
		fetchMessages,
		fetchSessionsByScope,
	} = api;

	const startNewSession = useCallback(async () => {
		if (!task || !project) return;

		startThinking();
		setLoading(false);
		closeAll();

		try {
			const session = await createSession({
				service,
				modelKey: model,
				title: `${step}: ${task.title}`,
				scope: { projectId: task.project_id, label: `${step}:${task.id}` },
			});

			setSessionId(session.id);

			const prompt = buildInitialPrompt(step, task, project);
			appendUserMessage(prompt);

			const response = await sendSessionMessage(session.id, prompt, service);
			appendAssistantMessage(response.id, response.content);
		} catch (err) {
			appendError(getErrorMessage(err, "Failed to create session"));
		} finally {
			stopThinking();
		}
	}, [
		appendAssistantMessage,
		appendError,
		appendUserMessage,
		closeAll,
		createSession,
		model,
		project,
		sendSessionMessage,
		service,
		setLoading,
		setSessionId,
		startThinking,
		step,
		stopThinking,
		task,
	]);

	const checkExistingSessions = useCallback(async () => {
		if (!task) return;

		setLoading(true);
		try {
			const sessions = await fetchSessionsByScope(
				{
					projectId: task.project_id,
					label: `${step}:${task.id}`,
				},
				service,
			);

			if (sessions.length === 0) {
				await startNewSession();
				return;
			}

			setExistingSessions(sessions);
			setShowSessionModal(true);
		} catch (err) {
			appendError(getErrorMessage(err, "Failed to initialize session"));
		} finally {
			setLoading(false);
		}
	}, [
		appendError,
		fetchSessionsByScope,
		setExistingSessions,
		setLoading,
		setShowSessionModal,
		startNewSession,
		step,
		task,
		service,
	]);

	const loadSession = useCallback(
		async (targetSessionId: string) => {
			closeAll();
			setSessionId(targetSessionId);
			setLoading(true);
			markResumed();

			try {
				const session = await fetchSession(targetSessionId, service);

				if (
					session?.stopRequested ||
					session?.status === "stopped" ||
					session?.status === "paused"
				) {
					markStopped();
				}

				const msgs = await fetchMessages(targetSessionId, service);
				setMessagesFromDb(msgs);
			} catch (err) {
				appendError(getErrorMessage(err, "Failed to load session"));
			} finally {
				setLoading(false);
			}
		},
		[
			appendError,
			closeAll,
			fetchMessages,
			fetchSession,
			markResumed,
			markStopped,
			setLoading,
			setMessagesFromDb,
			setSessionId,
			service,
		],
	);

	async function sendMessage(content: string) {
		if (!content.trim() || !sessionId || isThinking || isStopped) return;

		appendUserMessage(content);
		startThinking();

		try {
			const response = await sendSessionMessage(sessionId, content, service);
			appendAssistantMessage(response.id, response.content);
		} catch (err) {
			const errorMsg = getErrorMessage(err, "Failed to send message");

			if (errorMsg.includes("stopped") || errorMsg.includes("paused")) {
				try {
					const session = await fetchSession(sessionId, service);
					if (
						session?.stopRequested ||
						session?.status === "stopped" ||
						session?.status === "paused"
					) {
						markStopped();
					}
				} catch {
					markStopped();
				}
			}

			appendError(errorMsg);
		} finally {
			stopThinking();
		}
	}

	async function stopSession() {
		if (!sessionId) return;

		try {
			await stopSessionApi(sessionId, service);
			markStopped();
		} catch (err) {
			appendError(getErrorMessage(err, "Failed to stop session"));
		}
	}

	async function resumeSession() {
		if (!sessionId) return;

		try {
			await resumeSessionApi(sessionId, service);
			markResumed();
		} catch (err) {
			appendError(getErrorMessage(err, "Failed to resume session"));
		}
	}

	async function handleShowHistory() {
		if (!task) return;

		try {
			const sessions = await fetchSessionsByScope(
				{
					projectId: task.project_id,
					label: `${step}:${task.id}`,
				},
				service,
			);
			setExistingSessions(sessions);
		} catch {
			// Use whatever we already have
		}
		setShowHistory(true);
	}

	return {
		startNewSession,
		checkExistingSessions,
		loadSession,
		sendMessage,
		stopSession,
		resumeSession,
		handleShowHistory,
	};
}
