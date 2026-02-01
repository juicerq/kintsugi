import type { RouterOutputs } from "@kintsugi/shared";
import { trpc } from "../../../../trpc";

type UiInvalidateEvent = RouterOutputs["events"]["onInvalidate"];

interface ThinkingEvent {
	content: string;
	isActive: boolean;
}

interface ToolProgressEvent {
	toolName: string;
	toolUseId: string;
	elapsedSeconds: number;
	isActive: boolean;
}

interface UseSessionEventsOptions {
	sessionId: string | null;
	onStatusChanged?: (status: string, stopRequested: number) => void;
	onNewMessage?: (messageCount: number) => void;
	onStopped?: (reason: "user" | "error" | "system") => void;
	onThinking?: (event: ThinkingEvent) => void;
	onToolProgress?: (event: ToolProgressEvent) => void;
	onPartialMessage?: (content: string) => void;
	onConnectionError?: () => void;
}

export function useSessionEvents({
	sessionId,
	onStatusChanged,
	onNewMessage,
	onStopped,
	onThinking,
	onToolProgress,
	onPartialMessage,
	onConnectionError,
}: UseSessionEventsOptions) {
	trpc.events.onInvalidate.useSubscription(undefined, {
		onError() {
			// Clean up stale streaming state if connection drops
			onConnectionError?.();
		},
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

				case "session.thinking":
					if (event.sessionId === sessionId) {
						onThinking?.({
							content: event.content,
							isActive: event.isActive,
						});
					}
					break;

				case "session.toolProgress":
					if (event.sessionId === sessionId) {
						onToolProgress?.({
							toolName: event.toolName,
							toolUseId: event.toolUseId,
							elapsedSeconds: event.elapsedSeconds,
							isActive: event.isActive,
						});
					}
					break;

				case "session.partialMessage":
					if (event.sessionId === sessionId) {
						onPartialMessage?.(event.content);
					}
					break;
			}
		},
	});
}
