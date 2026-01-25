import { useState } from "react";
import { Input } from "@/components/ui/input";
import { trpc } from "../../../../trpc";

interface SubtaskCreateInputProps {
	taskId: string;
}

export function SubtaskCreateInput({ taskId }: SubtaskCreateInputProps) {
	const [name, setName] = useState("");
	const utils = trpc.useUtils();

	const createSubtask = trpc.subtasks.create.useMutation({
		onSuccess: () => {
			setName("");
			utils.subtasks.list.invalidate({ taskId });
			utils.tasks.get.invalidate({ id: taskId });
		},
	});

	function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
		if (e.key === "Enter" && name.trim()) {
			createSubtask.mutate({ taskId, name: name.trim() });
		}
		if (e.key === "Escape") {
			setName("");
			e.currentTarget.blur();
		}
	}

	return (
		<Input
			type="text"
			value={name}
			onChange={(e) => setName(e.target.value)}
			onKeyDown={handleKeyDown}
			placeholder="Add subtask..."
			disabled={createSubtask.isPending}
		/>
	);
}
