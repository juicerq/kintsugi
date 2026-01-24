import { createFileRoute } from "@tanstack/react-router";
import { trpc } from "../trpc";
import { CreateProjectInput } from "./-components/create-project-input";
import { ProjectCard } from "./-components/project-card";

export const Route = createFileRoute("/")({
	component: HomePage,
});

function HomePage() {
	const [projects] = trpc.projects.list.useSuspenseQuery();

	return (
		<div className="px-6 py-4">
			<CreateProjectInput />

			{projects.length === 0 && (
				<div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-12">
					<p className="text-muted-foreground">No projects yet</p>
					<p className="mt-1 text-sm text-muted-foreground">
						Create your first project to get started
					</p>
				</div>
			)}

			{projects.length > 0 && (
				<div className="flex flex-col gap-2">
					{projects.map((project) => (
						<ProjectCard key={project.id} project={project} />
					))}
				</div>
			)}
		</div>
	);
}
