import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface SidebarState {
	isCollapsed: boolean;
	expandedProjectIds: string[];
}

interface SidebarActions {
	toggle: () => void;
	setCollapsed: (collapsed: boolean) => void;
	toggleExpanded: (projectId: string) => void;
	collapseAll: () => void;
	isExpanded: (projectId: string) => boolean;
}

export const useSidebarStore = create<SidebarState & SidebarActions>()(
	persist(
		(set, get) => ({
			// State
			isCollapsed: false,
			expandedProjectIds: [],

			// Actions
			toggle: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
			setCollapsed: (collapsed) => set({ isCollapsed: collapsed }),
			toggleExpanded: (projectId) =>
				set((state) => {
					const isCurrentlyExpanded =
						state.expandedProjectIds.includes(projectId);
					return {
						expandedProjectIds: isCurrentlyExpanded
							? state.expandedProjectIds.filter((id) => id !== projectId)
							: [...state.expandedProjectIds, projectId],
					};
				}),
			collapseAll: () => set({ expandedProjectIds: [] }),
			isExpanded: (projectId) => get().expandedProjectIds.includes(projectId),
		}),
		{
			name: "sidebar-storage",
			storage: createJSONStorage(() => localStorage),
			version: 2,
			migrate: (persistedState, version) => {
				const state = persistedState as Record<string, unknown>;
				if (version === 1) {
					// Migrate from single expandedProjectId to array
					const oldId = state.expandedProjectId as string | null;
					return {
						isCollapsed: (state.isCollapsed as boolean) ?? false,
						expandedProjectIds: oldId ? [oldId] : [],
					};
				}
				return persistedState as SidebarState;
			},
		},
	),
);
