import { Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { trpc, trpcClient } from "../trpc";
import { Header } from "./-components/header";

const queryClient = new QueryClient();

export const Route = createRootRoute({
	component: RootComponent,
});

function RootComponent() {
	return (
		<trpc.Provider client={trpcClient} queryClient={queryClient}>
			<QueryClientProvider client={queryClient}>
				<main className="min-h-screen bg-background">
					<Header />
					<Suspense
						fallback={
							<div className="px-6 py-4">
								<p className="text-muted-foreground">Loading...</p>
							</div>
						}
					>
						<Outlet />
					</Suspense>
				</main>
				<TanStackRouterDevtools />
			</QueryClientProvider>
		</trpc.Provider>
	);
}
