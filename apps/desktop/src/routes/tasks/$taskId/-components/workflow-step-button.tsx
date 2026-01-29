import { ChevronDown, Eye, History, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { modelOptions, type workflowSteps } from "@/lib/consts";
import type { ModelKey, Task } from "@/lib/types";
import { cn } from "@/lib/utils";
import { trpc } from "../../../../trpc";

interface WorkflowStepButtonProps {
	step: (typeof workflowSteps)[number];
	hasContent: boolean;
	task: Task;
	onSelect: (model: ModelKey) => void;
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
	const ref = useRef<HTMLDivElement>(null);

	const { data: sessions } = trpc.ai.sessions.listByScope.useQuery({
		service: "claude",
		scope: {
			projectId: task.project_id,
			label: `${step.key}:${task.id}`,
		},
		limit: 10,
	});

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
	const sessionCount = sessions?.length ?? 0;
	const hasSessions = sessionCount > 0;
	const lastSession = sessions?.[0];

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
				<div className="absolute right-0 top-full mt-1 z-50 min-w-[180px] rounded-md border border-white/10 bg-[#1a1a1a] py-1 shadow-xl">
					{hasSessions && lastSession && (
						<>
							<DropdownButton
								icon={<Play className="h-3 w-3" />}
								label="Continue last session"
								className="text-emerald-400 hover:text-emerald-300"
								onClick={() => {
									setOpen(false);
									onContinueLastSession(lastSession.id);
								}}
							/>
							<DropdownButton
								icon={<History className="h-3 w-3" />}
								label="View all sessions"
								onClick={() => {
									setOpen(false);
									onShowHistory();
								}}
							/>
							<DropdownButton
								icon={<Eye className="h-3 w-3" />}
								label="View"
								onClick={() => {
									setOpen(false);
									onViewEdit();
								}}
							/>
							<div className="my-1 h-px bg-white/10" />
							<div className="px-3 py-1 text-[10px] text-white/40">
								New session with:
							</div>
						</>
					)}

					{!hasSessions && (
						<>
							<DropdownButton
								icon={<Eye className="h-3 w-3" />}
								label="View"
								onClick={() => {
									setOpen(false);
									onViewEdit();
								}}
							/>
							<div className="my-1 h-px bg-white/10" />
						</>
					)}

					{modelOptions.map((model) => (
						<button
							key={model.key}
							type="button"
							onClick={() => {
								setOpen(false);
								onSelect(model.key);
							}}
							className="flex w-full items-center gap-2 px-3 py-1.5 text-[11px] text-white/70 hover:bg-white/10 hover:text-white/90 transition-colors"
						>
							<span
								className={cn("w-1.5 h-1.5 rounded-full", model.dotColor)}
							/>
							{model.label}
						</button>
					))}
				</div>
			)}
		</div>
	);
}

interface DropdownButtonProps {
	icon: React.ReactNode;
	label: string;
	onClick: () => void;
	className?: string;
}

function DropdownButton({
	icon,
	label,
	onClick,
	className,
}: DropdownButtonProps) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={cn(
				"flex w-full items-center gap-2 px-3 py-1.5 text-[11px] text-white/70 hover:bg-white/10 hover:text-white/90 transition-colors",
				className,
			)}
		>
			{icon}
			{label}
		</button>
	);
}
