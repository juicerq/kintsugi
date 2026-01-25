import { useState } from "react";
import { Text } from "@/components/ui/text";
import { SubtaskCreateInput } from "./subtask-create-input";
import { SubtaskItem } from "./subtask-item";
import type { Subtask } from "./types";

interface SubtaskListProps {
	taskId: string;
	subtasks: Subtask[];
}

export function SubtaskList({ taskId, subtasks }: SubtaskListProps) {
	const [expandedId, setExpandedId] = useState<string | null>(null);

	function handleToggle(id: string) {
		setExpandedId((prev) => (prev === id ? null : id));
	}

	return (
		<>
			<Text size="xs" variant="label" className="mb-2">
				Subtasks
			</Text>
			<div className="flex flex-col gap-2">
				<SubtaskCreateInput taskId={taskId} />
				<div className="flex flex-col gap-1">
					{subtasks.map((subtask) => (
						<SubtaskItem
							key={subtask.id}
							subtask={subtask}
							isExpanded={expandedId === subtask.id}
							onToggle={() => handleToggle(subtask.id)}
						/>
					))}
				</div>
			</div>
		</>
	);
}
