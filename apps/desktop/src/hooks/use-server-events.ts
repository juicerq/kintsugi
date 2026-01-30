import type { RouterOutputs } from "@kintsugi/shared";
import type { QueryClient } from "@tanstack/react-query";
import { trpc } from "../trpc";

type UiInvalidateEvent = RouterOutputs["events"]["onInvalidate"];

type EventHandlerMap = {
	[K in UiInvalidateEvent["type"]]: (
		event: Extract<UiInvalidateEvent, { type: K }>,
	) => void;
};

function createHandlers(queryClient: QueryClient): EventHandlerMap {
	return {
		"subtask.updated": (event) => {
			queryClient.invalidateQueries({
				queryKey: [["subtasks", "list"], { input: { taskId: event.taskId } }],
			});
			queryClient.invalidateQueries({
				queryKey: [["subtasks", "get"], { input: { id: event.subtaskId } }],
			});
			queryClient.invalidateQueries({
				queryKey: [["tasks", "get"], { input: { id: event.taskId } }],
			});
		},
		"execution.statusChanged": (event) => {
			const queryKey = [
				["execution", "getStatus"],
				{ input: { taskId: event.taskId }, type: "query" },
			];

			if (event.status === null) {
				queryClient.setQueryData(queryKey, null);
			} else {
				queryClient.setQueryData(queryKey, {
					id: event.executionId,
					taskId: event.taskId,
					status: event.status,
					currentSubtaskId: event.currentSubtaskId,
					currentSessionId: event.currentSessionId,
					service: event.service,
					error: event.error,
				});
			}

			// Invalidate sidebar data when execution status changes
			queryClient.invalidateQueries({
				queryKey: [["projects", "listWithTasks"]],
			});
		},
		"execution.started": (event) => {
			queryClient.invalidateQueries({
				queryKey: [["subtasks", "list"], { input: { taskId: event.taskId } }],
			});
		},
		"execution.subtaskStarted": (event) => {
			queryClient.invalidateQueries({
				queryKey: [["subtasks", "list"], { input: { taskId: event.taskId } }],
			});
		},
		"execution.subtaskCompleted": (event) => {
			queryClient.invalidateQueries({
				queryKey: [["subtasks", "list"], { input: { taskId: event.taskId } }],
			});
		},
		"execution.subtaskFailed": (event) => {
			queryClient.invalidateQueries({
				queryKey: [["subtasks", "list"], { input: { taskId: event.taskId } }],
			});
		},
		"execution.stopped": (event) => {
			queryClient.invalidateQueries({
				queryKey: [["subtasks", "list"], { input: { taskId: event.taskId } }],
			});
		},
		"session.statusChanged": (event) => {
			queryClient.invalidateQueries({
				queryKey: [
					["ai", "sessions", "get"],
					{ input: { sessionId: event.sessionId } },
				],
			});
			queryClient.invalidateQueries({
				queryKey: [["ai", "sessions", "listByScope"]],
			});
		},
		"session.newMessage": (event) => {
			queryClient.invalidateQueries({
				queryKey: [
					["ai", "messages", "list"],
					{ input: { sessionId: event.sessionId } },
				],
			});
			queryClient.invalidateQueries({
				queryKey: [["ai", "sessions", "listByScope"]],
			});
		},
		"session.stopped": (event) => {
			queryClient.invalidateQueries({
				queryKey: [
					["ai", "sessions", "get"],
					{ input: { sessionId: event.sessionId } },
				],
			});
			queryClient.invalidateQueries({
				queryKey: [["ai", "sessions", "listByScope"]],
			});
		},
	};
}

export function useServerEvents(queryClient: QueryClient) {
	const handlers = createHandlers(queryClient);

	trpc.events.onInvalidate.useSubscription(undefined, {
		onData(event) {
			const handler = handlers[event.type] as
				| ((event: UiInvalidateEvent) => void)
				| undefined;
			if (!handler) return;
			handler(event);
		},
	});
}
