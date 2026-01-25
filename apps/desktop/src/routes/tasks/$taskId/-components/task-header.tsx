import { formatDistanceToNow } from "date-fns";
import {
	Check,
	ChevronDown,
	Clock,
	Copy,
	GitBranch,
	Sparkles,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { Title } from "@/components/ui/title";
import { cn } from "@/lib/utils";
import { trpc } from "../../../../trpc";
import { WorkflowDialog } from "./workflow-dialog";

interface TaskHeaderProps {
	task: {
		id: string;
		project_id: string;
		title: string;
		description: string | null;
		branch_name: string | null;
		brainstorm: string | null;
		architecture: string | null;
		review: string | null;
		created_at: string;
		completed_at: string | null;
	};
	completedSubtasks?: number;
	totalSubtasks?: number;
}

export function TaskHeader({
	task,
	completedSubtasks = 0,
	totalSubtasks = 0,
}: TaskHeaderProps) {
	const [expanded, setExpanded] = useState(false);
	const [copied, setCopied] = useState(false);
	const [workflowOpen, setWorkflowOpen] = useState(false);

	const utils = trpc.useUtils();
	const toggleComplete = trpc.tasks.toggleComplete.useMutation({
		onSuccess: () => {
			utils.tasks.get.invalidate({ id: task.id });
			utils.tasks.list.invalidate({ projectId: task.project_id });
		},
	});

	const isCompleted = task.completed_at !== null;

	const workflowStages = [
		{
			key: "brainstorm",
			hasContent: !!task.brainstorm,
			color: "bg-purple-500",
			fadedColor: "bg-purple-500/30",
		},
		{
			key: "architecture",
			hasContent: !!task.architecture,
			color: "bg-amber-500",
			fadedColor: "bg-amber-500/30",
		},
		{
			key: "review",
			hasContent: !!task.review,
			color: "bg-green-500",
			fadedColor: "bg-green-500/30",
		},
	];

	const completedStages = workflowStages.filter((s) => s.hasContent).length;

	async function handleCopyBranch(e: React.MouseEvent) {
		e.stopPropagation();
		if (!task.branch_name) return;
		await navigator.clipboard.writeText(task.branch_name);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	}

	function handleToggleComplete(e: React.MouseEvent) {
		e.stopPropagation();
		toggleComplete.mutate({ id: task.id });
	}

	const relativeTime = formatDistanceToNow(new Date(task.created_at), {
		addSuffix: true,
	});

	return (
		<>
			<div className="w-full transition-colors p-3 rounded-md hover:bg-white/3">
				{/* Main row - always visible */}
				<div className="flex w-full items-start gap-3  -mx-1 text-left">
					{/* Checkbox */}
					<motion.div
						onClick={handleToggleComplete}
						className={cn(
							"flex size-4.5 mt-0.5 shrink-0 items-center justify-center active:scale-95 rounded-sm border transition-colors cursor-pointer",
							isCompleted
								? "border-emerald-500 bg-emerald-500/50"
								: "border-white/20 hover:border-white/40",
						)}
					>
						{isCompleted && <Check className="h-3 w-3 text-white/80" />}
					</motion.div>

					{/* Title */}
					<div className="flex-1 space-y-2 flex flex-col">
						<div className="flex items-center gap-4">
							<Title
								size="lg"
								className={cn(
									"flex-1 truncate transition-colors",
									isCompleted && "text-white/25 line-through",
								)}
							>
								{task.title}
							</Title>

							{totalSubtasks > 0 && (
								<Badge variant={isCompleted ? "emerald" : "default"}>
									{completedSubtasks}/{totalSubtasks}
								</Badge>
							)}
						</div>

						<Text variant="muted">{task.description}</Text>
					</div>
				</div>

				<div className="w-full bg-white/10 my-2 rounded-md h-px" />

				<div className="flex items-center">
					<Badge
						onClick={handleCopyBranch}
						className="cursor-pointer flex items-center hover:bg-white/10 active:hover:bg-white/15"
					>
						<GitBranch className="h-3 w-3 text-white/40" />
						{task.branch_name}
					</Badge>

					<div className="ml-auto flex items-center gap-1.5">
						<Text variant="faint" size="xs">
							Created {relativeTime}
						</Text>
					</div>
				</div>
			</div>

			<div></div>

			{/* Workflow Dialog */}
			<WorkflowDialog
				open={workflowOpen}
				onOpenChange={setWorkflowOpen}
				task={task}
			/>
		</>
	);
}
