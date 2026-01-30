import { Plus } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { Text } from "@/components/ui/text";
import { useSidebarData } from "@/hooks/use-sidebar-data";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/stores/sidebar-store";
import { CreateProjectModal } from "./create-project-modal";
import { SidebarProjectItem } from "./sidebar-project-item";
import { SidebarToggle } from "./sidebar-toggle";

const SIDEBAR_WIDTH = 240;
const SIDEBAR_COLLAPSED_WIDTH = 48;

export function Sidebar() {
	const { isCollapsed, toggle, toggleExpanded, isExpanded } = useSidebarStore();
	const { projects, isLoading, error } = useSidebarData();
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

	return (
		<motion.aside
			initial={false}
			animate={{
				width: isCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH,
			}}
			transition={{ duration: 0.2, ease: "easeInOut" }}
			className={cn(
				"relative flex h-full shrink-0 flex-col border-r border-sidebar-border bg-sidebar",
			)}
		>
			<SidebarToggle isCollapsed={isCollapsed} onToggle={toggle} />

			{/* Sidebar content */}
			<div
				className={cn(
					"flex-1 overflow-y-auto overflow-x-hidden p-2",
					isCollapsed && "invisible",
				)}
			>
				{/* Header */}
				<div className="mb-3 flex items-center justify-between px-2 pt-2">
					<Text variant="label" size="xs">
						Projects
					</Text>
					<button
						type="button"
						onClick={() => setIsCreateModalOpen(true)}
						className={cn(
							"flex size-5 items-center justify-center rounded",
							"text-white/30 hover:text-white/60 hover:bg-white/[0.06]",
							"transition-colors duration-150",
						)}
					>
						<Plus className="size-3.5" strokeWidth={1.5} />
					</button>
				</div>

				{/* Loading state */}
				{isLoading && (
					<div className="flex items-center justify-center py-8">
						<Text variant="muted" size="sm">
							Loading...
						</Text>
					</div>
				)}

				{/* Error state */}
				{error && (
					<div className="px-2 py-4">
						<Text variant="muted" size="sm">
							Failed to load projects
						</Text>
					</div>
				)}

				{/* Projects list */}
				{!isLoading && !error && projects.length === 0 && (
					<div className="px-2 py-4">
						<Text variant="muted" size="sm">
							No projects yet
						</Text>
					</div>
				)}

				{!isLoading && !error && projects.length > 0 && (
					<div className="flex flex-col gap-1">
						{projects.map((project) => (
							<SidebarProjectItem
								key={project.id}
								project={project}
								isExpanded={isExpanded(project.id)}
								onToggle={() => toggleExpanded(project.id)}
							/>
						))}
					</div>
				)}
			</div>

			<CreateProjectModal
				isOpen={isCreateModalOpen}
				onClose={() => setIsCreateModalOpen(false)}
			/>
		</motion.aside>
	);
}
