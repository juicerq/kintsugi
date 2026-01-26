import type { UiInvalidateEvent } from "./types";

type UiEventListener = (event: UiInvalidateEvent) => void;

class UiEventBus {
	private listeners = new Set<UiEventListener>();

	subscribe(listener: UiEventListener) {
		this.listeners.add(listener);
		return () => {
			this.listeners.delete(listener);
		};
	}

	publish(event: UiInvalidateEvent) {
		for (const listener of this.listeners) {
			listener(event);
		}
	}
}

export const uiEventBus = new UiEventBus();
