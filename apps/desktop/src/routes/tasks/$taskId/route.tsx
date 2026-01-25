import { createFileRoute } from "@tanstack/react-router";
import { trpc } from "../../../trpc";
import { TaskHeader } from "./-components/task-header";
import { SubtaskList } from "./-components/subtask-list";

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
    <div className="px-6 py-4 space-y-4">
      <TaskHeader
        task={task}
        completedSubtasks={subtasks.filter((s) => s.status === "completed").length}
        totalSubtasks={subtasks.length}
      />
      <SubtaskList subtasks={subtasks} />
    </div>
  );
}
