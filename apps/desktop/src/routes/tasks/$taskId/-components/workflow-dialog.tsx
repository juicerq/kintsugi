import { useCallback, useEffect, useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { workflowSteps } from "@/lib/consts";
import type { Task, WorkflowStep } from "@/lib/types";
import { cn } from "@/lib/utils";
import { trpc } from "../../../../trpc";

interface WorkflowDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	initialTab?: WorkflowStep;
	task: Task;
}

export function WorkflowDialog({
	open,
	onOpenChange,
	initialTab,
	task,
}: WorkflowDialogProps) {
	const [activeTab, setActiveTab] = useState<WorkflowStep>(
		initialTab ?? "brainstorm",
	);

	useEffect(() => {
		if (open && initialTab) {
			setActiveTab(initialTab);
		}
	}, [open, initialTab]);
	const [content, setContent] = useState(task[activeTab] ?? "");
	const [isSaving, setIsSaving] = useState(false);

	const utils = trpc.useUtils();

	const updateTask = trpc.tasks.update.useMutation({
		onMutate: () => setIsSaving(true),
		onSettled: () => setIsSaving(false),
		onSuccess: () => {
			utils.tasks.get.invalidate({ id: task.id });
		},
	});

	useEffect(() => {
		setContent(task[activeTab] ?? "");
	}, [activeTab, task]);

	const debouncedSave = useCallback(
		debounce((value: string) => {
			updateTask.mutate({
				id: task.id,
				[activeTab]: value || null,
			});
		}, 500),
		[],
	);

	function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
		const value = e.target.value;
		setContent(value);
		debouncedSave(value);
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-2xl p-0 gap-0 overflow-hidden">
				<DialogHeader className="px-4 pt-4 pb-3 border-b border-white/10">
					<div className="flex items-center justify-between">
						<DialogTitle className="text-[14px] font-medium text-white/90">
							Workflow
						</DialogTitle>
						{isSaving && (
							<span className="text-[11px] text-white/40">Saving...</span>
						)}
					</div>

					{/* Tabs */}
					<div className="flex gap-1 mt-2">
						{workflowSteps.map((step) => (
							<button
								key={step.key}
								type="button"
								onClick={() => setActiveTab(step.key)}
								className={cn(
									"flex items-center gap-2 px-3 py-1.5 rounded-md text-[12px] transition-colors",
									activeTab === step.key
										? "bg-white/10 text-white"
										: "text-white/50 hover:text-white/70 hover:bg-white/[0.04]",
								)}
							>
								<step.icon className="w-3 h-3" />
								{step.label}
							</button>
						))}
					</div>
				</DialogHeader>

				{/* Editor */}
				<div className="p-4">
					<textarea
						value={content}
						onChange={handleChange}
						placeholder={`Write your ${activeTab} notes here...`}
						className="w-full h-[280px] bg-white/[0.02] border border-white/10 rounded-md px-3 py-2 text-[13px] text-white/80 placeholder:text-white/30 focus:outline-none focus:border-white/20 resize-none"
					/>
				</div>
			</DialogContent>
		</Dialog>
	);
}

function debounce<Args extends unknown[]>(
	fn: (...args: Args) => void,
	ms: number,
) {
	let timeoutId: ReturnType<typeof setTimeout>;
	return (...args: Args) => {
		clearTimeout(timeoutId);
		timeoutId = setTimeout(() => fn(...args), ms);
	};
}
