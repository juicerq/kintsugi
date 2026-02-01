import { useState } from "react";
import { Text } from "@/components/ui/text";
import type { ModelKey, ServiceKey } from "@/lib/types";
import { trpc } from "../../../../trpc";
import { RunAllButton } from "./run-all-button";
import { SubtaskCreateInput } from "./subtask-create-input";
import { SubtaskItem } from "./subtask-item";
import type { Subtask } from "./types";

interface SubtaskListProps {
	taskId: string;
	subtasks: Subtask[];
}

export function SubtaskList({ taskId, subtasks }: SubtaskListProps) {
	const [expandedId, setExpandedId] = useState<string | null>(null);

	const { data: executionStatus } = trpc.execution.getStatus.useQuery(
		{ taskId },
		{ staleTime: 5000, refetchOnWindowFocus: true },
	);

	const runAll = trpc.execution.runAll.useMutation();
	const runSingle = trpc.execution.runSingle.useMutation();
	const stop = trpc.execution.stop.useMutation();

	const isExecuting = executionStatus?.status === "running";
	const currentSubtaskId = executionStatus?.currentSubtaskId ?? null;

	function handleToggle(id: string) {
		setExpandedId((prev) => (prev === id ? null : id));
	}

	function handleRunAll(service: ServiceKey, modelKey: ModelKey) {
		runAll.mutate({ taskId, modelKey, service });
	}

	function handleRunSingle(
		subtaskId: string,
		service: ServiceKey,
		modelKey: ModelKey,
	) {
		runSingle.mutate({ taskId, subtaskId, modelKey, service });
	}

	function handleStop() {
		stop.mutate({ taskId });
	}

	return (
		<>
			<div className="flex items-center justify-between mb-2">
				<Text size="xs" variant="label">
					Subtasks
				</Text>
				{subtasks.length > 0 && (
					<div className="flex items-center gap-2">
						<RunAllButton
							isExecuting={isExecuting}
							onRun={handleRunAll}
							onStop={handleStop}
						/>
					</div>
				)}
			</div>
			<div className="flex flex-col gap-2">
				<SubtaskCreateInput taskId={taskId} />
				<div className="flex flex-col gap-1">
					{subtasks.map((subtask) => (
						<SubtaskItem
							key={subtask.id}
							subtask={subtask}
							isExpanded={expandedId === subtask.id}
							isRunning={currentSubtaskId === subtask.id}
							onToggle={() => handleToggle(subtask.id)}
							onRun={(service, modelKey) =>
								handleRunSingle(subtask.id, service, modelKey)
							}
						/>
					))}
				</div>
			</div>
		</>
	);
}
