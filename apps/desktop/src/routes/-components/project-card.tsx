import type { RouterOutputs } from "@kintsugi/shared";
import { DragHandle } from "./drag-handle";

type Project = RouterOutputs["projects"]["list"][number];

interface ProjectCardProps {
	project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
	// Mock tasks for now - will come from API later
	const tasks = [
		{ id: "1", title: "Teste" },
		{ id: "2", title: "Pre-running next task status" },
	];
	const taskCount = 23; // Mock count

	return (
		<div className="rounded-lg bg-card p-4">
			<div className="flex items-start gap-3">
				<DragHandle />

				<div className="flex-1 min-w-0">
					<div className="flex items-center justify-between">
						<h3 className="font-semibold text-foreground">{project.name}</h3>
						<span className="flex items-center justify-center min-w-[28px] h-7 px-2 rounded-full bg-muted text-xs text-muted-foreground">
							{taskCount}
						</span>
					</div>

					{tasks.length > 0 && (
						<ul className="mt-3 space-y-1.5">
							{tasks.map((task) => (
								<li key={task.id} className="flex items-center gap-2 text-sm text-muted-foreground">
									<span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
									<span className="truncate">{task.title}</span>
								</li>
							))}
						</ul>
					)}
				</div>
			</div>
		</div>
	);
}
