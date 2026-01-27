import { Link } from "@tanstack/react-router";
import type { Project } from "@/lib/types";
import { DragHandle } from "./drag-handle";

interface ProjectCardProps {
	project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
	const tasks = [
		{ id: "1", title: "Teste" },
		{ id: "2", title: "Pre-running next task status" },
	];
	const taskCount = 23;

	return (
		<Link to="/projects/$projectId" params={{ projectId: project.id }}>
			<div className="rounded-lg bg-white/[0.02] border border-white/[0.04] px-3.5 py-3 hover:bg-white/[0.04] hover:border-white/[0.08] hover:shadow-[0_2px_8px_rgba(0,0,0,0.3)] active:scale-[0.99] transition-all duration-150 ease-out cursor-pointer">
				<div className="flex items-start gap-2">
					<DragHandle />

					<div className="flex-1 min-w-0">
						<div className="flex items-center justify-between">
							<h3 className="text-[13px] font-medium text-white/90 tracking-[-0.01em]">
								{project.name}
							</h3>
							<span className="flex items-center justify-center min-w-[28px] h-6 px-2 rounded-full bg-white/8 text-[11px] text-white/50 font-medium">
								{taskCount}
							</span>
						</div>

						{tasks.length > 0 && (
							<ul className="mt-2.5 space-y-1.5">
								{tasks.map((task) => (
									<li
										key={task.id}
										className="flex items-center gap-2 text-[12px] text-white/50 tracking-[-0.01em]"
									>
										<span className="h-1 w-1 rounded-full bg-white/30" />
										<span className="truncate">{task.title}</span>
									</li>
								))}
							</ul>
						)}
					</div>
				</div>
			</div>
		</Link>
	);
}
