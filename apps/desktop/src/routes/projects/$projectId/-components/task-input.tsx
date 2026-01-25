import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { trpc } from "../../../../trpc";

interface TaskInputProps {
	projectId: string;
}

export function TaskInput({ projectId }: TaskInputProps) {
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [branchName, setBranchName] = useState("");
	const [expanded, setExpanded] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);

	const utils = trpc.useUtils();
	const createTask = trpc.tasks.create.useMutation({
		onSuccess: () => {
			utils.tasks.list.invalidate({ projectId });
			setTitle("");
			setDescription("");
			setBranchName("");
			setExpanded(false);
		},
	});

	function handleBlur(e: React.FocusEvent) {
		if (containerRef.current?.contains(e.relatedTarget)) return;
		if (title || description || branchName) return;
		setExpanded(false);
	}

	function handleKeyDown(e: React.KeyboardEvent) {
		if (e.key !== "Enter") return;
		if (!title.trim()) return;

		createTask.mutate({
			projectId,
			title: title.trim(),
			description: description.trim() || undefined,
			branchName: branchName.trim() || undefined,
		});
	}

	function handleCancel() {
		setTitle("");
		setDescription("");
		setBranchName("");
		setExpanded(false);
	}

	function handleCreate() {
		if (!title.trim()) return;

		createTask.mutate({
			projectId,
			title: title.trim(),
			description: description.trim() || undefined,
			branchName: branchName.trim() || undefined,
		});
	}

	return (
		<div
			ref={containerRef}
			className={`mb-6 rounded-md transition-colors ${expanded ? "-m-3 border border-white/10 bg-white/3 p-3" : ""}`}
			onBlur={handleBlur}
		>
			<Input
				placeholder="What needs to be done?"
				value={title}
				onChange={(e) => setTitle(e.target.value)}
				onFocus={() => setExpanded(true)}
				onKeyDown={handleKeyDown}
			/>

			<AnimatePresence>
				{expanded && (
					<motion.div
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: "auto" }}
						exit={{ opacity: 0, height: 0 }}
						transition={{ duration: 0.2, ease: "easeOut" }}
						className="-mx-1 overflow-hidden px-1"
					>
						<Text size="sm" variant="muted" className="mb-1.5 mt-4">
							Description
						</Text>
						<textarea
							placeholder="Add more details..."
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							className="placeholder:text-muted-foreground dark:bg-input/30 border-input min-h-[72px] w-full resize-none rounded-md border bg-transparent px-3 py-2 text-sm outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 placeholder:text-xs"
						/>
						<Text size="sm" variant="muted" className="mb-1.5 mt-4">
							Branch
						</Text>
						<Input
							placeholder="feature/my-task"
							value={branchName}
							onChange={(e) => setBranchName(e.target.value)}
						/>
						<div className="mt-4 flex justify-end gap-2">
							<Button variant="ghost" size="sm" className="text-white/40 hover:bg-transparent" onClick={handleCancel}>
								Cancel
							</Button>
							<Button
								variant="secondary"
								size="sm"
								onClick={handleCreate}
								disabled={!title.trim() || createTask.isPending}
							>
								Create Task
							</Button>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
