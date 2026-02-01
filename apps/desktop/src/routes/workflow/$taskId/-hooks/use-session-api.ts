import { useCallback } from "react";
import type { ModelKey, SessionSummary } from "@/lib/types";
import { trpc } from "../../../../trpc";

export function useSessionApi() {
	const utils = trpc.useUtils();
	const createMutation = trpc.ai.sessions.create.useMutation();
	const sendMutation = trpc.ai.messages.send.useMutation();
	const stopMutation = trpc.ai.sessions.stop.useMutation();
	const resumeMutation = trpc.ai.sessions.resume.useMutation();

	const createSession = useCallback(
		async (opts: {
			modelKey: ModelKey;
			title: string;
			scope: { projectId: string; label: string };
		}) => {
			return createMutation.mutateAsync({
				service: "claude",
				...opts,
			});
		},
		[createMutation],
	);

	const sendMessage = useCallback(
		async (sessionId: string, content: string) => {
			return sendMutation.mutateAsync({
				service: "claude",
				sessionId,
				content,
			});
		},
		[sendMutation],
	);

	const stopSession = useCallback(
		async (sessionId: string) => {
			await stopMutation.mutateAsync({
				service: "claude",
				sessionId,
			});
		},
		[stopMutation],
	);

	const resumeSession = useCallback(
		async (sessionId: string) => {
			await resumeMutation.mutateAsync({
				service: "claude",
				sessionId,
			});
		},
		[resumeMutation],
	);

	const fetchSession = useCallback(
		async (sessionId: string) => {
			return utils.ai.sessions.get.fetch({
				service: "claude",
				sessionId,
			});
		},
		[utils],
	);

	const fetchMessages = useCallback(
		async (sessionId: string) => {
			const msgs = await utils.ai.messages.list.fetch({
				service: "claude",
				sessionId,
			});
			return msgs ?? [];
		},
		[utils],
	);

	const fetchSessionsByScope = useCallback(
		async (scope: { projectId: string; label: string }, limit = 10) => {
			const sessions = await utils.ai.sessions.listByScope.fetch({
				service: "claude",
				scope,
				limit,
			});
			return (sessions ?? []) as SessionSummary[];
		},
		[utils],
	);

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

export type SessionApi = ReturnType<typeof useSessionApi>;
