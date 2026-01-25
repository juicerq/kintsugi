import type { VariantProps } from "class-variance-authority";
import {
	Check,
	CheckCheck,
	Code,
	Copy,
	FileText,
	FlaskConical,
	Pause,
	Play,
	RefreshCw,
	Wrench,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Badge, type badgeVariants } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import { trpc } from "../../../../trpc";
import { SubtaskDetails } from "./subtask-details";
import type { Subtask, SubtaskCategory, SubtaskStatus } from "./types";

interface SubtaskItemProps {
	subtask: Subtask;
	isExpanded: boolean;
	onToggle: () => void;
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
};

export function SubtaskItem({
	subtask,
	isExpanded,
	onToggle,
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

	function handleCopyClick(e: React.MouseEvent) {
		e.stopPropagation();
		navigator.clipboard.writeText(subtask.id);
	}

	const config = subtask.category ? categoryConfig[subtask.category] : null;

	return (
		<div
			className={cn(
				"group rounded-md transition-colors py-1 px-2",
				"hover:bg-white/3",
				isExpanded && "bg-white/4",
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
						"flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-sm border transition-all duration-150 ease-out active:scale-90",
						isCompleted
							? "border-white/50 bg-white/50"
							: "border-white/25 hover:border-white/40",
					)}
				>
					{isCompleted && <Check className="h-2 w-2 text-[#0a0a0a]" />}
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
					<div className="flex items-center gap-2">
						<Text
							size="xs"
							variant="faint"
							className="shrink-0 font-mono truncate max-w-20"
						>
							{subtask.id}
						</Text>
						<Button
							variant="ghost"
							className="opacity-0 group-hover:opacity-100 transition-opacity active:bg-muted"
							size="icon-xs"
							onClick={handleCopyClick}
						>
							<Copy className="size-3 stroke-accent-foreground/40" />
						</Button>
					</div>
				</div>

				<div className="flex-1" />

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
	);
}
