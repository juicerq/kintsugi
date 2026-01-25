import { useCallback, useEffect, useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { trpc } from "../../../../trpc";

type WorkflowTab = "brainstorm" | "architecture" | "review";

interface WorkflowDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	task: {
		id: string;
		brainstorm: string | null;
		architecture: string | null;
		review: string | null;
	};
}

const tabs: { key: WorkflowTab; label: string; color: string }[] = [
	{ key: "brainstorm", label: "Brainstorm", color: "bg-purple-500" },
	{ key: "architecture", label: "Architecture", color: "bg-amber-500" },
	{ key: "review", label: "Review", color: "bg-green-500" },
];

export function WorkflowDialog({
	open,
	onOpenChange,
	task,
}: WorkflowDialogProps) {
	const [activeTab, setActiveTab] = useState<WorkflowTab>("brainstorm");
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
						{tabs.map((tab) => (
							<button
								key={tab.key}
								type="button"
								onClick={() => setActiveTab(tab.key)}
								className={cn(
									"flex items-center gap-2 px-3 py-1.5 rounded-md text-[12px] transition-colors",
									activeTab === tab.key
										? "bg-white/10 text-white"
										: "text-white/50 hover:text-white/70 hover:bg-white/[0.04]",
								)}
							>
								<span className={cn("w-2 h-2 rounded-full", tab.color)} />
								{tab.label}
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
