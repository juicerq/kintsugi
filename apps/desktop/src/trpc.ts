import type { AppRouter } from "@kintsugi/server/src/router";
import { createWSClient, httpBatchLink, splitLink, wsLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";

export const trpc = createTRPCReact<AppRouter>();

const wsClient = createWSClient({ url: "ws://localhost:3002" });

export const trpcClient = trpc.createClient({
	links: [
		splitLink({
			condition(op) {
				return op.type === "subscription";
			},
			true: wsLink({ client: wsClient }),
			false: httpBatchLink({
				url: "http://localhost:3001/trpc",
			}),
		}),
	],
});
