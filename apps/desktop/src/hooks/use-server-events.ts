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
				queryKey: trpc.subtasks.list.getQueryKey({
					taskId: event.taskId,
				}),
			});
			queryClient.invalidateQueries({
				queryKey: trpc.subtasks.get.getQueryKey({
					id: event.subtaskId,
				}),
			});
			queryClient.invalidateQueries({
				queryKey: trpc.tasks.get.getQueryKey({ id: event.taskId }),
			});
		},
	};
}

export function useServerEvents(queryClient: QueryClient) {
	const handlers = createHandlers(queryClient);

	trpc.events.onInvalidate.useSubscription(undefined, {
		onData(event) {
			const handler = handlers[event.type];
			if (!handler) {
				return;
			}
			handler(event as Extract<UiInvalidateEvent, { type: typeof event.type }>);
		},
	});
}
