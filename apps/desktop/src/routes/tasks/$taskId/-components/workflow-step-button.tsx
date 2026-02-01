import { ChevronDown, Eye, History, Play } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	modelOptionsClaude,
	modelOptionsOpencode,
	serviceOptions,
	type workflowSteps,
} from "@/lib/consts";
import type { ModelKey, ServiceKey, Task } from "@/lib/types";
import { cn } from "@/lib/utils";
import { trpc } from "../../../../trpc";

interface WorkflowStepButtonProps {
	step: (typeof workflowSteps)[number];
	hasContent: boolean;
	task: Task;
	onSelect: (service: ServiceKey, model: ModelKey) => void;
	onViewEdit: () => void;
	onContinueLastSession: (sessionId: string) => void;
	onShowHistory: () => void;
}

export function WorkflowStepButton({
	step,
	hasContent,
	task,
	onSelect,
	onViewEdit,
	onContinueLastSession,
	onShowHistory,
}: WorkflowStepButtonProps) {
	const [open, setOpen] = useState(false);

	const { data: sessions } = trpc.ai.sessions.listByScope.useQuery({
		service: "claude",
		scope: {
			projectId: task.project_id,
			label: `${step.key}:${task.id}`,
		},
		limit: 10,
	});

	const Icon = step.icon;
	const sessionCount = sessions?.length ?? 0;
	const hasSessions = sessionCount > 0;
	const lastSession = sessions?.[0];

	function handleSelect(service: ServiceKey, model: ModelKey) {
		setOpen(false);
		onSelect(service, model);
	}

	return (
		<DropdownMenu open={open} onOpenChange={setOpen}>
			<DropdownMenuTrigger asChild>
				<Badge
					variant={hasContent ? step.variant : "default"}
					className="cursor-pointer gap-1 rounded-md py-1 px-2 hover:bg-white/10 active:bg-white/15"
				>
					<Icon className="h-3 w-3" />
					{step.label}
					<ChevronDown className="h-2.5 w-2.5 opacity-50" />
				</Badge>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="end"
				side="bottom"
				sideOffset={4}
				className="w-[180px]"
				onCloseAutoFocus={(e) => e.preventDefault()}
			>
				{hasSessions && lastSession && (
					<>
						<DropdownMenuItem
							className="gap-2 text-xs text-emerald-400 focus:text-emerald-300"
							onClick={() => {
								setOpen(false);
								onContinueLastSession(lastSession.id);
							}}
						>
							<Play className="h-3 w-3" />
							Continue last session
						</DropdownMenuItem>
						<DropdownMenuItem
							className="gap-2 text-xs"
							onClick={() => {
								setOpen(false);
								onShowHistory();
							}}
						>
							<History className="h-3 w-3" />
							View all sessions
						</DropdownMenuItem>
						<DropdownMenuItem
							className="gap-2 text-xs"
							onClick={() => {
								setOpen(false);
								onViewEdit();
							}}
						>
							<Eye className="h-3 w-3" />
							View
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<div className="px-2 py-1 text-[10px] text-white/40">
							New session with:
						</div>
					</>
				)}

				{!hasSessions && (
					<>
						<DropdownMenuItem
							className="gap-2 text-xs"
							onClick={() => {
								setOpen(false);
								onViewEdit();
							}}
						>
							<Eye className="h-3 w-3" />
							View
						</DropdownMenuItem>
						<DropdownMenuSeparator />
					</>
				)}

				{serviceOptions.map((service) => (
					<DropdownMenuSub key={service.key}>
						<DropdownMenuSubTrigger className="gap-2 text-xs text-white/70">
							<span
								className={cn("h-1.5 w-1.5 rounded-full", service.dotColor)}
							/>
							{service.label}
						</DropdownMenuSubTrigger>
						<DropdownMenuSubContent className="w-[160px]">
							{(service.key === "claude"
								? modelOptionsClaude
								: modelOptionsOpencode
							).map((model) => (
								<DropdownMenuItem
									key={model.key}
									className="gap-2 text-xs text-white/70 focus:text-white/90"
									onClick={() => handleSelect(service.key, model.key)}
								>
									<span
										className={cn("h-1.5 w-1.5 rounded-full", model.dotColor)}
									/>
									{model.label}
								</DropdownMenuItem>
							))}
						</DropdownMenuSubContent>
					</DropdownMenuSub>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
