import { useNavigate } from "@tanstack/react-router";
import { Check, GitBranch } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Text } from "@/components/ui/text";
import { Title } from "@/components/ui/title";
import { workflowSteps } from "@/lib/consts";
import type { ModelKey, SessionSummary, Task, WorkflowStep } from "@/lib/types";
import { cn } from "@/lib/utils";
import { trpc } from "../../../../trpc";
import { SessionHistory } from "../../../workflow/$taskId/-components/session-history";
import { WorkflowDialog } from "./workflow-dialog";
import { WorkflowStepButton } from "./workflow-step-button";

interface TaskHeaderProps {
	task: Task;
	completedSubtasks?: number;
	totalSubtasks?: number;
}

export function TaskHeader({
	task,
	completedSubtasks = 0,
	totalSubtasks = 0,
}: TaskHeaderProps) {
	const navigate = useNavigate();
	const [dialogOpen, setDialogOpen] = useState(false);
	const [dialogTab, setDialogTab] = useState<WorkflowStep>("brainstorm");
	const [historyOpen, setHistoryOpen] = useState(false);
	const [historyStep, setHistoryStep] = useState<WorkflowStep>("brainstorm");
	const [historySessions, setHistorySessions] = useState<SessionSummary[]>([]);

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
			search: { step, model, sessionId: undefined },
		});
	}

	function handleContinueSession(step: WorkflowStep, sessionId: string) {
		navigate({
			to: "/workflow/$taskId",
			params: { taskId: task.id },
			search: { step, model: "opus-4.5", sessionId },
		});
	}

	function handleViewEdit(step: WorkflowStep) {
		setDialogTab(step);
		setDialogOpen(true);
	}

	async function handleShowHistory(step: WorkflowStep) {
		setHistoryStep(step);
		try {
			const sessions = await utils.ai.sessions.listByScope.fetch({
				service: "claude",
				scope: {
					projectId: task.project_id,
					label: `${step}:${task.id}`,
				},
				limit: 10,
			});
			setHistorySessions((sessions as SessionSummary[]) ?? []);
		} catch {
			setHistorySessions([]);
		}
		setHistoryOpen(true);
	}

	return (
		<div className="w-full transition-colors p-3 rounded-md bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_0%,transparent_95%)] hover:bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_0%,transparent_95%)]">
			{/* Main row */}
			<div className="flex w-full items-start gap-3 -mx-1 text-left">
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
				{task.branch_name && <BranchBadge branchName={task.branch_name} />}

				<div className="ml-auto flex items-center gap-1.5">
					{workflowSteps.map((step) => (
						<WorkflowStepButton
							key={step.key}
							step={step}
							hasContent={task[step.key] !== null}
							task={task}
							onSelect={(model) => handleWorkflowStep(step.key, model)}
							onViewEdit={() => handleViewEdit(step.key)}
							onContinueLastSession={(sessionId) =>
								handleContinueSession(step.key, sessionId)
							}
							onShowHistory={() => handleShowHistory(step.key)}
						/>
					))}
				</div>
			</div>

			<WorkflowDialog
				open={dialogOpen}
				onOpenChange={setDialogOpen}
				initialTab={dialogTab}
				task={task}
			/>

			<SessionHistory
				isOpen={historyOpen}
				onClose={() => setHistoryOpen(false)}
				sessions={historySessions}
				step={historyStep}
				onSelectSession={(sessionId) => {
					setHistoryOpen(false);
					handleContinueSession(historyStep, sessionId);
				}}
			/>
		</div>
	);
}

function BranchBadge({ branchName }: { branchName: string }) {
	async function handleCopy(e: React.MouseEvent) {
		e.stopPropagation();
		await navigator.clipboard.writeText(branchName);
	}

	return (
		<Badge
			onClick={handleCopy}
			className="cursor-pointer rounded-md py-1 px-2 flex items-center hover:bg-white/10 active:hover:bg-white/15"
		>
			<GitBranch className="h-3 w-3 text-white/40" />
			{branchName}
		</Badge>
	);
}
