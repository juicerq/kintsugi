import { useNavigate } from "@tanstack/react-router";
import {
	BookOpen,
	Check,
	ChevronDown,
	GitBranch,
	Lightbulb,
	Search,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Text } from "@/components/ui/text";
import { Title } from "@/components/ui/title";
import { cn } from "@/lib/utils";
import { trpc } from "../../../../trpc";

type WorkflowStep = "brainstorm" | "architecture" | "review";
type ModelKey = "opus-4.5" | "sonnet-4.5" | "haiku-4.5";

const modelOptions: { key: ModelKey; label: string }[] = [
	{ key: "opus-4.5", label: "Opus 4.5" },
	{ key: "sonnet-4.5", label: "Sonnet 4.5" },
	{ key: "haiku-4.5", label: "Haiku 4.5" },
];

const workflowSteps: {
	key: WorkflowStep;
	label: string;
	icon: typeof Lightbulb;
	variant: "violet" | "amber" | "emerald";
}[] = [
	{ key: "brainstorm", label: "Brainstorm", icon: Lightbulb, variant: "violet" },
	{ key: "architecture", label: "Architecture", icon: BookOpen, variant: "amber" },
	{ key: "review", label: "Review", icon: Search, variant: "emerald" },
];

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
	const navigate = useNavigate();

	const utils = trpc.useUtils();
	const toggleComplete = trpc.tasks.toggleComplete.useMutation({
		onSuccess: () => {
			utils.tasks.get.invalidate({ id: task.id });
			utils.tasks.list.invalidate({ projectId: task.project_id });
		},
	});

	const isCompleted = task.completed_at !== null;

	function handleToggleComplete(e: React.MouseEvent) {
		e.stopPropagation();
		toggleComplete.mutate({ id: task.id });
	}

	function handleWorkflowStep(step: WorkflowStep, model: ModelKey) {
		navigate({
			to: "/workflow/$taskId",
			params: { taskId: task.id },
			search: { step, model },
		});
	}

	return (
		<div className="w-full transition-colors p-3 rounded-md bg-white/3 hover:bg-white/4">
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
				{task.branch_name && (
					<TaskHeaderBranchName branchName={task.branch_name} />
				)}

				<div className="ml-auto flex items-center gap-1.5">
					{workflowSteps.map((step) => (
						<WorkflowStepButton
							key={step.key}
							step={step}
							hasContent={task[step.key] !== null}
							onSelect={(model) => handleWorkflowStep(step.key, model)}
						/>
					))}
				</div>
			</div>
		</div>
	);
}

interface WorkflowStepButtonProps {
	step: (typeof workflowSteps)[number];
	hasContent: boolean;
	onSelect: (model: ModelKey) => void;
}

function WorkflowStepButton({
	step,
	hasContent,
	onSelect,
}: WorkflowStepButtonProps) {
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!open) return;

		function handleClickOutside(e: MouseEvent) {
			if (ref.current && !ref.current.contains(e.target as Node)) {
				setOpen(false);
			}
		}

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [open]);

	const Icon = step.icon;

	return (
		<div ref={ref} className="relative">
			<Badge
				variant={hasContent ? step.variant : "default"}
				onClick={() => setOpen((o) => !o)}
				className="cursor-pointer gap-1 rounded-md py-1 px-2 hover:bg-white/10 active:bg-white/15"
			>
				<Icon className="h-3 w-3" />
				{step.label}
				<ChevronDown
					className={cn(
						"h-2.5 w-2.5 opacity-50 transition-transform",
						open && "rotate-180",
					)}
				/>
			</Badge>

			{open && (
				<div className="absolute right-0 top-full mt-1 z-50 min-w-[140px] rounded-md border border-white/10 bg-[#1a1a1a] py-1 shadow-xl">
					{modelOptions.map((model) => (
						<button
							key={model.key}
							type="button"
							onClick={() => {
								setOpen(false);
								onSelect(model.key);
							}}
							className="flex w-full items-center px-3 py-1.5 text-[11px] text-white/70 hover:bg-white/10 hover:text-white/90 transition-colors"
						>
							{model.label}
						</button>
					))}
				</div>
			)}
		</div>
	);
}

interface TaskHeaderBranchNameProps {
	branchName: string;
}

function TaskHeaderBranchName({ branchName }: TaskHeaderBranchNameProps) {
	async function handleCopyBranch(e: React.MouseEvent) {
		e.stopPropagation();
		await navigator.clipboard.writeText(branchName);
	}

	return (
		<Badge
			onClick={handleCopyBranch}
			className="cursor-pointer rounded-md py-1 px-2 flex items-center hover:bg-white/10 active:hover:bg-white/15"
		>
			<GitBranch className="h-3 w-3 text-white/40" />
			{branchName}
		</Badge>
	);
}
