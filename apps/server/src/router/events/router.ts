import { observable } from "@trpc/server/observable";
import { uiEventBus } from "../../events/bus";
import type { UiInvalidateEvent } from "../../events/types";
import { publicProcedure, router } from "../../lib/trpc";

export const eventsRouter = router({
	onInvalidate: publicProcedure.subscription(() => {
		return observable<UiInvalidateEvent>((emit) => {
			const unsubscribe = uiEventBus.subscribe((event) => {
				emit.next(event);
			});
			return () => {
				unsubscribe();
			};
		});
	}),
});
