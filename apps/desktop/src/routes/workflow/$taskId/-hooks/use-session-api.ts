import { useCallback } from "react";
import type { ModelKey, ServiceKey, SessionSummary } from "@/lib/types";
import { trpc } from "../../../../trpc";

export function useSessionApi() {
	const utils = trpc.useUtils();
	const createMutation = trpc.ai.sessions.create.useMutation();
	const sendMutation = trpc.ai.messages.send.useMutation();
	const stopMutation = trpc.ai.sessions.stop.useMutation();
	const resumeMutation = trpc.ai.sessions.resume.useMutation();

	const createSession = useCallback(
		async (opts: {
			service: ServiceKey;
			modelKey: ModelKey;
			title: string;
			scope: { projectId: string; label: string };
		}) => {
			return createMutation.mutateAsync(opts);
		},
		[createMutation],
	);

	const sendMessage = useCallback(
		async (sessionId: string, content: string, service: ServiceKey) => {
			return sendMutation.mutateAsync({
				service,
				sessionId,
				content,
			});
		},
		[sendMutation],
	);

	const stopSession = useCallback(
		async (sessionId: string, service: ServiceKey) => {
			await stopMutation.mutateAsync({
				service,
				sessionId,
			});
		},
		[stopMutation],
	);

	const resumeSession = useCallback(
		async (sessionId: string, service: ServiceKey) => {
			await resumeMutation.mutateAsync({
				service,
				sessionId,
			});
		},
		[resumeMutation],
	);

	const fetchSession = useCallback(
		async (sessionId: string, service: ServiceKey) => {
			return utils.ai.sessions.get.fetch({
				service,
				sessionId,
			});
		},
		[utils],
	);

	const fetchMessages = useCallback(
		async (sessionId: string, service: ServiceKey) => {
			const msgs = await utils.ai.messages.list.fetch({
				service,
				sessionId,
			});
			return msgs ?? [];
		},
		[utils],
	);

	const fetchSessionsByScope = useCallback(
		async (
			scope: { projectId: string; label: string },
			service: ServiceKey,
			limit = 10,
		) => {
			const sessions = await utils.ai.sessions.listByScope.fetch({
				service,
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
