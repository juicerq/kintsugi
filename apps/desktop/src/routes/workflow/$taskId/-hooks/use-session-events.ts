import type { RouterOutputs } from "@kintsugi/shared";
import { trpc } from "../../../../trpc";

type UiInvalidateEvent = RouterOutputs["events"]["onInvalidate"];

interface UseSessionEventsOptions {
	sessionId: string | null;
	onStatusChanged?: (status: string, stopRequested: number) => void;
	onNewMessage?: (messageCount: number) => void;
	onStopped?: (reason: "user" | "error" | "system") => void;
}

export function useSessionEvents({
	sessionId,
	onStatusChanged,
	onNewMessage,
	onStopped,
}: UseSessionEventsOptions) {
	trpc.events.onInvalidate.useSubscription(undefined, {
		onData(event: UiInvalidateEvent) {
			if (!sessionId) return;

			switch (event.type) {
				case "session.statusChanged":
					if (event.sessionId === sessionId) {
						onStatusChanged?.(event.status, event.stopRequested);
					}
					break;

				case "session.newMessage":
					if (event.sessionId === sessionId) {
						onNewMessage?.(event.messageCount);
					}
					break;

				case "session.stopped":
					if (event.sessionId === sessionId) {
						onStopped?.(event.reason);
					}
					break;
			}
		},
	});
}
