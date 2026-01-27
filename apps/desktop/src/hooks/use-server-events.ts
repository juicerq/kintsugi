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
	function invalidateExecution(taskId: string) {
		queryClient.invalidateQueries({
			queryKey: [["execution", "getStatus"], { input: { taskId } }],
		});
		queryClient.invalidateQueries({
			queryKey: [["subtasks", "list"], { input: { taskId } }],
		});
	}

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
		"execution.started": (event) => {
			invalidateExecution(event.taskId);
		},
		"execution.subtaskStarted": (event) => {
			invalidateExecution(event.taskId);
		},
		"execution.subtaskCompleted": (event) => {
			invalidateExecution(event.taskId);
		},
		"execution.subtaskFailed": (event) => {
			invalidateExecution(event.taskId);
		},
		"execution.stopped": (event) => {
			invalidateExecution(event.taskId);
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
