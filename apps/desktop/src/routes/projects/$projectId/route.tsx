import { createFileRoute } from "@tanstack/react-router";
import { trpc } from "../../../trpc";
import { SettingsButton } from "./-components/settings-button";
import { TaskInput } from "./-components/task-input";
import { TaskList } from "./-components/task-list";

export const Route = createFileRoute("/projects/$projectId")({
	component: ProjectTasksPage,
});

function ProjectTasksPage() {
	const { projectId } = Route.useParams();
	const [tasks] = trpc.tasks.list.useSuspenseQuery({ projectId });

	const incompleteTasks = tasks.filter((t) => !t.completed_at);
	const completedTasks = tasks.filter((t) => t.completed_at);

	return (
		<div className="px-6 py-4">
			<div className="flex items-center justify-end mb-4">
				<SettingsButton />
			</div>
			<TaskInput projectId={projectId} />
			<TaskList incompleteTasks={incompleteTasks} completedTasks={completedTasks} />
		</div>
	);
}
