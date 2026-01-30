import { ChevronRight, Folder, Plus } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { Text } from "@/components/ui/text";
import type { SidebarProject } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CreateTaskModal } from "./create-task-modal";
import { SidebarTaskItem } from "./sidebar-task-item";

interface SidebarProjectItemProps {
	project: SidebarProject;
	isExpanded: boolean;
	onToggle: () => void;
}

export function SidebarProjectItem({
	project,
	isExpanded,
	onToggle,
}: SidebarProjectItemProps) {
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

	const runningTasksCount = useMemo(
		() => project.tasks.filter((t) => t.isRunning).length,
		[project.tasks],
	);
	const hasRunningTasks = runningTasksCount > 0;

	return (
		<div className="select-none">
			{/* Project header */}
			<button
				type="button"
				onClick={onToggle}
				aria-expanded={isExpanded}
				className={cn(
					"group flex w-full items-center gap-2 rounded-md px-2 py-1.5 transition-all",
					"hover:bg-sidebar-accent/50",
					isExpanded &&
						"bg-[linear-gradient(to_right,rgba(255,255,255,0.08)_0%,transparent_70%)]",
				)}
			>
				<motion.div
					initial={false}
					animate={{ rotate: isExpanded ? 90 : 0 }}
					transition={{ duration: 0.15 }}
				>
					<ChevronRight className="h-3.5 w-3.5 text-white/40" />
				</motion.div>

				<Folder className="h-4 w-4 text-white/50" />

				<Text
					variant={isExpanded ? "primary" : "default"}
					weight="medium"
					className="flex-1 min-w-0 truncate text-left"
				>
					{project.name}
				</Text>

				{/* Running tasks indicator */}
				{hasRunningTasks && (
					<div className="flex items-center gap-1">
						<span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-kintsugi-pulse" />
						<Text size="xs" variant="faint">
							{runningTasksCount}
						</Text>
					</div>
				)}
			</button>

			{/* Tasks list with animation */}
			<AnimatePresence initial={false}>
				{isExpanded && (
					<motion.div
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: "auto", opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						transition={{ duration: 0.2, ease: "easeInOut" }}
						className="overflow-hidden"
					>
						<div className="py-1 pl-4 space-y-0.5">
							{/* Create task button - always first */}
							<button
								type="button"
								onClick={() => setIsCreateModalOpen(true)}
								className={cn(
									"flex w-full items-center gap-2 py-1.5 pl-6 pr-2 rounded-md",
									"border border-dashed border-white/15",
									"text-white/40 hover:text-white/60",
									"hover:border-white/25 hover:bg-white/[0.02]",
									"transition-colors duration-150",
								)}
							>
								<Plus className="size-3" />
								<Text size="sm" variant="faint">
									New task
								</Text>
							</button>

							{project.tasks.map((task) => (
								<SidebarTaskItem key={task.id} task={task} />
							))}
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			<CreateTaskModal
				isOpen={isCreateModalOpen}
				onClose={() => setIsCreateModalOpen(false)}
				projectId={project.id}
			/>
		</div>
	);
}
