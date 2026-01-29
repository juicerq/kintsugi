import { Link } from "@tanstack/react-router";
import { ArrowLeft, History } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Title } from "@/components/ui/title";
import { workflowSteps } from "@/lib/consts";
import type { ModelKey, WorkflowStep } from "@/lib/types";

const stepMeta = Object.fromEntries(
	workflowSteps.map((s) => [
		s.key,
		{ label: s.label, icon: s.icon, variant: s.variant },
	]),
) as Record<
	WorkflowStep,
	{
		label: string;
		icon: (typeof workflowSteps)[number]["icon"];
		variant: "violet" | "amber" | "emerald";
	}
>;

interface WorkflowHeaderProps {
	taskId: string;
	taskTitle: string;
	model: ModelKey;
	step: WorkflowStep;
	hasSession: boolean;
	onShowHistory: () => void;
}

export function WorkflowHeader({
	taskId,
	taskTitle,
	model,
	step,
	hasSession,
	onShowHistory,
}: WorkflowHeaderProps) {
	const meta = stepMeta[step];
	const Icon = meta.icon;

	return (
		<div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06]">
			<Link
				to="/tasks/$taskId"
				params={{ taskId }}
				className="text-white/40 hover:text-white/70 transition-colors"
			>
				<ArrowLeft className="h-4 w-4" />
			</Link>

			<div className="flex items-center gap-2 flex-1 min-w-0">
				<Title size="default" className="truncate">
					{taskTitle}
				</Title>
			</div>

			<Badge variant="default" className="py-1 px-2">
				{model}
			</Badge>

			<Badge variant={meta.variant} className="gap-1.5 py-1 px-2">
				<Icon className="h-3 w-3" />
				{meta.label}
			</Badge>

			{hasSession && (
				<button
					type="button"
					onClick={onShowHistory}
					className="p-1.5 rounded-md text-white/40 hover:bg-white/10 hover:text-white/70 transition-colors"
					title="View sessions"
				>
					<History className="h-4 w-4" />
				</button>
			)}
		</div>
	);
}
