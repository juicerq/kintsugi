import { Clock, MessageSquare, Play, Plus, X } from "lucide-react";
import { useState } from "react";
import { Text } from "@/components/ui/text";
import { Title } from "@/components/ui/title";
import { workflowSteps } from "@/lib/consts";
import type { SessionSummary, WorkflowStep } from "@/lib/types";
import { cn } from "@/lib/utils";

interface SessionChoiceModalProps {
	isOpen: boolean;
	onClose: () => void;
	sessions: SessionSummary[];
	step: WorkflowStep;
	onContinueSession: (sessionId: string) => void;
	onStartNewSession: () => void;
}

export function SessionChoiceModal({
	isOpen,
	onClose,
	sessions,
	step,
	onContinueSession,
	onStartNewSession,
}: SessionChoiceModalProps) {
	const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
		sessions[0]?.id ?? null,
	);

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
			<div className="w-full max-w-sm max-h-[70vh] overflow-hidden rounded-md border border-white/10 bg-[#1a1a1a] shadow-2xl flex flex-col">
				{/* Header */}
				<div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5 shrink-0">
					<div>
						<Title>{stepMeta?.label} Sessions</Title>
						<Text size="xs" variant="faint" className="mt-0.5">
							Continue existing or start new
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
				<div className="overflow-y-auto flex-1 py-1">
					<Text size="xs" variant="label" className="px-4 py-1.5">
						Sessions ({sessions.length})
					</Text>

					{sessions.map((session) => (
						<button
							type="button"
							key={session.id}
							onClick={() => setSelectedSessionId(session.id)}
							className={cn(
								"w-full flex items-center gap-3 px-4 py-2 text-left transition-colors",
								selectedSessionId === session.id
									? "bg-white/[0.08] border-l-2 border-l-white/30"
									: "hover:bg-white/[0.04] border-l-2 border-l-transparent",
							)}
						>
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
							</div>

							<span className="flex items-center gap-1 text-white/30 shrink-0">
								<MessageSquare className="h-2.5 w-2.5" />
								<Text size="xs" variant="faint">
									{session.message_count}
								</Text>
							</span>
						</button>
					))}
				</div>

				{/* Footer */}
				<div className="flex items-center gap-2 border-t border-white/10 px-4 py-2.5 shrink-0">
					<button
						type="button"
						onClick={onStartNewSession}
						className="flex items-center gap-1.5 rounded px-3 py-1.5 text-[11px] text-white/60 hover:bg-white/[0.06] hover:text-white/80 transition-colors"
					>
						<Plus className="h-3 w-3" />
						New session
					</button>

					<div className="flex-1" />

					<button
						type="button"
						disabled={!selectedSessionId}
						onClick={() =>
							selectedSessionId && onContinueSession(selectedSessionId)
						}
						className={cn(
							"flex items-center gap-1.5 rounded px-3 py-1.5 text-[11px] transition-colors",
							selectedSessionId
								? "bg-white/10 hover:bg-white/15 text-white/80"
								: "bg-white/[0.04] text-white/25 cursor-not-allowed",
						)}
					>
						<Play className="h-3 w-3" />
						Continue
					</button>
				</div>
			</div>
		</div>
	);
}
