import type { AppRouter } from "@kintsugi/server/src/router";
import type { TRPCClientErrorLike } from "@trpc/client";
import type { SidebarProject } from "@/lib/types";
import { trpc } from "../trpc";

interface UseSidebarDataReturn {
	/** List of projects with their tasks and running status */
	projects: SidebarProject[];
	/** Loading state for initial fetch */
	isLoading: boolean;
	/** Error if query failed */
	error: TRPCClientErrorLike<AppRouter> | null;
}

/**
 * Hook to fetch and manage sidebar data (projects with tasks and running status).
 * Automatically updates via server events invalidation in use-server-events.ts.
 */
export function useSidebarData(): UseSidebarDataReturn {
	const { data, isLoading, error } = trpc.projects.listWithTasks.useQuery(
		undefined,
		{
			// Keep data fresh but don't refetch too aggressively
			staleTime: 1000 * 30, // 30 seconds
			refetchOnWindowFocus: true,
		},
	);

	const projects = data ?? [];

	return {
		projects,
		isLoading,
		error: error ?? null,
	};
}
