import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRootRoute, Outlet } from "@tanstack/react-router";
// import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { Suspense } from "react";
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
				<main className="min-h-screen bg-background relative before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(ellipse_120%_80%_at_0%_0%,rgba(255,255,255,0.05),transparent_50%)] after:pointer-events-none after:absolute after:inset-0 after:bg-[radial-gradient(ellipse_100%_70%_at_100%_100%,rgba(0,0,0,0.05),transparent_50%)]">
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
				{/*<TanStackRouterDevtools />*/}
			</QueryClientProvider>
		</trpc.Provider>
	);
}
