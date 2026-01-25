import { useState } from "react";
import { Input } from "@/components/ui/input";
import { trpc } from "../../../../trpc";

interface TaskInputProps {
	projectId: string;
}

export function TaskInput({ projectId }: TaskInputProps) {
	const [title, setTitle] = useState("");

	const utils = trpc.useUtils();
	const createTask = trpc.tasks.create.useMutation({
		onSuccess: () => {
			utils.tasks.list.invalidate({ projectId });
			setTitle("");
		},
	});

	function handleKeyDown(e: React.KeyboardEvent) {
		if (e.key !== "Enter") return;
		if (!title.trim()) return;

		createTask.mutate({ projectId, title: title.trim() });
	}

	return (
		<div className="mb-6">
			<Input
				placeholder="What needs to be done?"
				value={title}
				onChange={(e) => setTitle(e.target.value)}
				onKeyDown={handleKeyDown}
			/>
		</div>
	);
}
