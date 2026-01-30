import { Link } from "@tanstack/react-router";
import { Check, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import type { TaskListItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { trpc } from "../../../../trpc";

interface TaskItemProps {
	task: TaskListItem;
}

export function TaskItem({ task }: TaskItemProps) {
	const [pendingDelete, setPendingDelete] = useState(false);

	const utils = trpc.useUtils();

	const toggleComplete = trpc.tasks.toggleComplete.useMutation({
		onSuccess: () => {
			utils.tasks.list.invalidate({ projectId: task.project_id });
		},
	});

	const deleteTask = trpc.tasks.delete.useMutation({
		onSuccess: () => {
			utils.tasks.list.invalidate({ projectId: task.project_id });
		},
	});

	const isCompleted = task.completed_at !== null;
	const allSubtasksComplete =
		task.total_subtasks > 0 && task.completed_subtasks === task.total_subtasks;

	function handleCheckboxClick(e: React.MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		toggleComplete.mutate({ id: task.id });
	}

	function handleDeleteClick(e: React.MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		if (!pendingDelete) {
			setPendingDelete(true);
			return;
		}
		deleteTask.mutate({ id: task.id });
	}

	return (
		<Link
			to="/tasks/$taskId"
			params={{ taskId: task.id }}
			className="group -mx-2 flex items-center gap-3 rounded-md border border-transparent px-2 py-2 transition-colors hover:border-white/10 hover:bg-white/[0.02]"
			onMouseLeave={() => setPendingDelete(false)}
		>
			<button
				type="button"
				onClick={handleCheckboxClick}
				className={cn(
					"flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border transition-colors",
					isCompleted
						? "border-white/20 bg-white/10"
						: "border-white/20 hover:border-white/40",
				)}
			>
				{isCompleted && <Check className="h-3 w-3 text-white/60" />}
			</button>

			<Text
				className={cn("flex-1 min-w-0 truncate", isCompleted && "line-through")}
				variant={isCompleted ? "muted" : "default"}
			>
				{task.title}
			</Text>

			{task.total_subtasks > 0 && (
				<div className="flex items-center gap-1.5">
					{allSubtasksComplete && <Check className="h-3 w-3 text-green-500" />}
					<Text size="xs" variant="muted">
						{task.completed_subtasks}/{task.total_subtasks}
					</Text>
				</div>
			)}

			<Button
				variant="ghost"
				size="icon-xs"
				onClick={handleDeleteClick}
				onBlur={() => setPendingDelete(false)}
				className={cn(
					"opacity-0 group-hover:opacity-100 transition-opacity",
					pendingDelete &&
						"opacity-100 bg-red-500/20 text-red-700 hover:bg-red-500/30 hover:text-red-600",
				)}
			>
				{pendingDelete ? (
					<Check className="h-3 w-3" />
				) : (
					<X className="h-3 w-3" />
				)}
			</Button>
		</Link>
	);
}
