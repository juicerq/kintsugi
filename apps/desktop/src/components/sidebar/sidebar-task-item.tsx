import { Link, useParams } from "@tanstack/react-router";
import { Text } from "@/components/ui/text";
import type { SidebarTask } from "@/lib/types";
import { cn } from "@/lib/utils";

interface SidebarTaskItemProps {
	task: SidebarTask;
}

export function SidebarTaskItem({ task }: SidebarTaskItemProps) {
	const params = useParams({ strict: false });
	const isActive = params.taskId === task.id;

	return (
		<Link
			to="/tasks/$taskId"
			params={{ taskId: task.id }}
			className={cn(
				"group flex items-center gap-2 rounded-md py-1.5 pl-6 pr-2 transition-all duration-150",
				isActive
					? "bg-[linear-gradient(to_right,rgba(255,255,255,0.1)_0%,transparent_70%)] text-sidebar-accent-foreground"
					: "bg-white/[0.02] hover:bg-white/[0.05]",
			)}
		>
			{/* Status indicator */}
			<div className="relative flex h-4 w-4 shrink-0 items-center justify-center">
				{task.isRunning ? (
					<>
						<span className="absolute h-2.5 w-2.5 rounded-full bg-amber-400/30 animate-ping" />
						<span className="relative h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.5)]" />
					</>
				) : (
					<span className="h-1.5 w-1.5 rounded-full bg-white/25 transition-colors group-hover:bg-white/35" />
				)}
			</div>

			<Text
				variant={isActive ? "primary" : "secondary"}
				className="flex-1 min-w-0 truncate"
			>
				{task.title}
			</Text>
		</Link>
	);
}
