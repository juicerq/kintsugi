import type { VariantProps } from "class-variance-authority";
import {
	AlertCircle,
	Check,
	CheckCheck,
	Code,
	FileText,
	FlaskConical,
	Pause,
	Play,
	RefreshCw,
	Wrench,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Badge, type badgeVariants } from "@/components/ui/badge";
import { BorderBeam } from "@/components/ui/border-beam";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import { trpc } from "../../../../trpc";
import { SubtaskDetails } from "./subtask-details";
import type { Subtask, SubtaskCategory, SubtaskStatus } from "./types";

interface SubtaskItemProps {
	subtask: Subtask;
	isExpanded: boolean;
	isRunning: boolean;
	onToggle: () => void;
	onRun?: () => void;
}

type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];

const categoryConfig: Record<
	SubtaskCategory,
	{ label: string; icon: React.ReactNode; variant: BadgeVariant }
> = {
	code: {
		label: "Code",
		icon: <Code className="h-2.5 w-2.5" />,
		variant: "sky",
	},
	test: {
		label: "Test",
		icon: <FlaskConical className="h-2.5 w-2.5" />,
		variant: "violet",
	},
	docs: {
		label: "Docs",
		icon: <FileText className="h-2.5 w-2.5" />,
		variant: "indigo",
	},
	fix: {
		label: "Fix",
		icon: <Wrench className="h-2.5 w-2.5" />,
		variant: "rose",
	},
	refactor: {
		label: "Refactor",
		icon: <RefreshCw className="h-2.5 w-2.5" />,
		variant: "emerald",
	},
};

const statusConfig: Record<
	SubtaskStatus,
	{ label: string; variant: BadgeVariant; icon: React.ReactNode }
> = {
	waiting: {
		label: "Waiting",
		variant: "default",
		icon: <Pause className="h-2.5 w-2.5" />,
	},
	in_progress: {
		label: "Active",
		variant: "amber",
		icon: <Play className="h-2.5 w-2.5" />,
	},
	completed: {
		label: "Completed",
		variant: "emerald",
		icon: <CheckCheck className="h-2.5 w-2.5" />,
	},
	failed: {
		label: "Failed",
		variant: "rose",
		icon: <AlertCircle className="h-2.5 w-2.5" />,
	},
};

export function SubtaskItem({
	subtask,
	isExpanded,
	isRunning,
	onToggle,
	onRun,
}: SubtaskItemProps) {
	const utils = trpc.useUtils();

	const updateSubtask = trpc.subtasks.update.useMutation({
		onSuccess: () => {
			utils.subtasks.list.invalidate({ taskId: subtask.task_id });
			utils.tasks.get.invalidate({ id: subtask.task_id });
		},
	});

	const isCompleted = subtask.status === "completed";

	function handleCheckboxClick(e: React.MouseEvent) {
		e.stopPropagation();
		updateSubtask.mutate({
			id: subtask.id,
			status: isCompleted ? "waiting" : "completed",
		});
	}

	function handleRunClick(e: React.MouseEvent) {
		e.stopPropagation();
		onRun?.();
	}

	const config = subtask.category ? categoryConfig[subtask.category] : null;

	return (
		<BorderBeam active={isRunning}>
			<div
				className={cn(
					"group rounded-md transition-colors py-1 px-2",
					"hover:bg-white/3",
					isExpanded &&
						"bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_0%,transparent_95%)]",
					isRunning && "bg-white/3",
				)}
			>
				<div
					onClick={onToggle}
					className="flex items-center gap-2 py-1.5 pr-1 cursor-pointer"
				>
					<button
						type="button"
						onClick={handleCheckboxClick}
						className={cn(
							"flex size-4 shrink-0 items-center justify-center rounded-sm border transition-all duration-150 ease-out active:scale-95",
							isCompleted
								? "border-emerald-500 bg-emerald-500/50"
								: "border-white/25 hover:border-white/40",
						)}
					>
						{isCompleted && <Check className="h-2 w-2 text-white/80" />}
					</button>

					<div className="flex items-center gap-2 min-w-0">
						<Text
							className={cn(
								"truncate transition-all duration-150",
								isCompleted && "line-through decoration-white/20",
							)}
							variant={isCompleted ? "faint" : "default"}
						>
							{subtask.name}
						</Text>
					</div>

					<div className="flex-1" />

					{subtask.status === "waiting" && onRun && !isRunning && (
						<Button
							variant="ghost"
							size="icon-xs"
							className="opacity-0 group-hover:opacity-100 transition-opacity text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
							onClick={handleRunClick}
						>
							<Play className="size-3 fill-current" />
						</Button>
					)}

					{config && (
						<Badge variant={config.variant}>
							{config.icon}
							{config.label}
						</Badge>
					)}

					<Badge variant={statusConfig[subtask.status].variant}>
						{statusConfig[subtask.status].icon}
						{statusConfig[subtask.status].label}
					</Badge>
				</div>

				<AnimatePresence>
					{isExpanded && (
						<motion.div
							initial={{ opacity: 0, height: 0 }}
							animate={{ opacity: 1, height: "auto" }}
							exit={{ opacity: 0, height: 0 }}
							transition={{ duration: 0.2, ease: "easeOut" }}
						>
							<SubtaskDetails subtask={subtask} />
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</BorderBeam>
	);
}
