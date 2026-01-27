import { Clock, MessageSquare, Play, X } from "lucide-react";
import { Text } from "@/components/ui/text";
import { Title } from "@/components/ui/title";
import { workflowSteps } from "@/lib/consts";
import type { SessionSummary, WorkflowStep } from "@/lib/types";
import { cn } from "@/lib/utils";

interface SessionHistoryProps {
	isOpen: boolean;
	onClose: () => void;
	sessions: SessionSummary[];
	step: WorkflowStep;
	onSelectSession: (sessionId: string) => void;
}

export function SessionHistory({
	isOpen,
	onClose,
	sessions,
	step,
	onSelectSession,
}: SessionHistoryProps) {
	if (!isOpen) return null;

	const stepMeta = workflowSteps.find((s) => s.key === step);

	function formatDate(dateStr: string) {
		const date = new Date(dateStr);
		return date.toLocaleDateString("en-US", {
			day: "2-digit",
			month: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
		});
	}

	function getStatusLabel(status: string | null, stopRequested: number) {
		if (stopRequested) return "Stopped";
		if (status === "paused") return "Paused";
		if (status === "running") return "Active";
		return "Finished";
	}

	function getStatusColor(status: string | null, stopRequested: number) {
		if (stopRequested) return "bg-rose-500/20 text-rose-400 border-rose-500/30";
		if (status === "paused")
			return "bg-amber-500/20 text-amber-400 border-amber-500/30";
		if (status === "running")
			return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
		return "bg-white/10 text-white/50 border-white/10";
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
			<div className="w-full max-w-md max-h-[70vh] overflow-hidden rounded-md border border-white/10 bg-[#1a1a1a] shadow-2xl">
				{/* Header */}
				<div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
					<div className="flex items-center gap-2">
						<Title>History: {stepMeta?.label}</Title>
						<Text size="xs" variant="faint">
							({sessions.length})
						</Text>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="rounded p-1 text-white/40 hover:bg-white/10 hover:text-white/70 transition-colors"
					>
						<X className="h-4 w-4" />
					</button>
				</div>

				{/* Session List */}
				<div className="overflow-y-auto max-h-[calc(70vh-44px)] py-1">
					{sessions.length === 0 && (
						<div className="flex items-center justify-center py-6 text-white/40">
							<Text size="sm">No sessions found</Text>
						</div>
					)}

					{sessions.map((session, index) => (
						<div
							key={session.id}
							className="flex items-center gap-3 px-4 py-2 hover:bg-white/[0.04] transition-colors group"
						>
							<Text
								size="xs"
								variant="faint"
								className="w-5 shrink-0 text-right tabular-nums"
							>
								#{sessions.length - index}
							</Text>

							<div className="flex items-center gap-1.5 min-w-0 flex-1">
								<Clock className="h-3 w-3 shrink-0 text-white/30" />
								<Text size="xs" variant="muted" className="shrink-0">
									{formatDate(session.created_at)}
								</Text>

								<span
									className={cn(
										"text-[9px] px-1.5 py-px rounded border shrink-0 ml-1",
										getStatusColor(session.status, session.stop_requested),
									)}
								>
									{getStatusLabel(session.status, session.stop_requested)}
								</span>

								<span className="flex items-center gap-1 text-white/30 shrink-0 ml-1">
									<MessageSquare className="h-2.5 w-2.5" />
									<Text size="xs" variant="faint">
										{session.message_count}
									</Text>
								</span>
							</div>

							<button
								type="button"
								onClick={() => onSelectSession(session.id)}
								className="flex items-center gap-1 px-2 py-1 text-[10px] rounded bg-white/[0.06] hover:bg-white/[0.12] text-white/60 hover:text-white/80 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
							>
								<Play className="h-2.5 w-2.5" />
								Continue
							</button>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
