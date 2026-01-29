import { Title } from "@/components/ui/title";
import type { TaskListItem } from "@/lib/types";
import { TaskItem } from "./task-item";

interface TaskListProps {
	incompleteTasks: TaskListItem[];
	completedTasks: TaskListItem[];
}

export function TaskList({ incompleteTasks, completedTasks }: TaskListProps) {
	return (
		<div className="space-y-6">
			<section>
				<Title size="sm" className="mb-2 text-white/60">
					Tasks
				</Title>
				{incompleteTasks.length === 0 && (
					<p className="text-[12px] text-white/40 py-2">No tasks yet</p>
				)}
				{incompleteTasks.map((task) => (
					<TaskItem key={task.id} task={task} />
				))}
			</section>

			{completedTasks.length > 0 && (
				<section>
					<Title size="sm" className="mb-2 text-white/60">
						Completed
					</Title>
					{completedTasks.map((task) => (
						<TaskItem key={task.id} task={task} />
					))}
				</section>
			)}
		</div>
	);
}
