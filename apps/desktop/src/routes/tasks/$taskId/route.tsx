import { createFileRoute } from "@tanstack/react-router";
import { Text } from "@/components/ui/text";
import { trpc } from "../../../trpc";
import { SubtaskList } from "./-components/subtask-list";
import { TaskHeader } from "./-components/task-header";
// import { TaskResume } from "./-components/task-resume";

export const Route = createFileRoute("/tasks/$taskId")({
	component: TaskDetailsPage,
});

function TaskDetailsPage() {
	const { taskId } = Route.useParams();
	const [task] = trpc.tasks.get.useSuspenseQuery({ id: taskId });
	const [subtasks] = trpc.subtasks.list.useSuspenseQuery({ taskId });

	if (!task) {
		return <div className="px-6 py-4">Task not found</div>;
	}

	return (
		<div className="flex flex-1 flex-col gap-4 p-4">
			<section className="grid grid-cols-5 gap-4">
				<div className="col-span-5">
					<Text size="xs" variant="label" className="mb-2">
						Task
					</Text>
					<TaskHeader
						task={task}
						completedSubtasks={
							subtasks.filter((s) => s.status === "completed").length
						}
						totalSubtasks={subtasks.length}
					/>
				</div>
				{/*TODO: terminar, repense o que adicionar aqui e etc*/}
				{/*<div className="col-span-2">
					<Text size="xs" variant="label" className="mb-2">
						Resume
					</Text>
					<TaskResume task={task} />
				</div>*/}
			</section>

			<section className="flex flex-col">
				<SubtaskList taskId={taskId} subtasks={subtasks} />
			</section>
		</div>
	);
}
