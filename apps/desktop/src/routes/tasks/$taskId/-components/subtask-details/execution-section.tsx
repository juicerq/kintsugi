import { AlertTriangle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Text } from "@/components/ui/text";

interface ExecutionSectionProps {
	startedAt: string | null;
	finishedAt: string | null;
	status: "waiting" | "in_progress" | "completed" | "failed";
	error: string | null;
}

function formatTime(isoString: string): string {
	const date = new Date(isoString);
	return date.toLocaleTimeString("en-US", {
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	});
}

function formatDuration(startedAt: string, finishedAt: string): string {
	const start = new Date(startedAt).getTime();
	const end = new Date(finishedAt).getTime();
	const diffMs = end - start;

	if (diffMs < 1000) return "< 1s";

	const seconds = Math.floor(diffMs / 1000);
	if (seconds < 60) return `${seconds}s`;

	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = seconds % 60;
	if (remainingSeconds === 0) return `${minutes}m`;
	return `${minutes}m ${remainingSeconds}s`;
}

export function ExecutionSection({
	startedAt,
	finishedAt,
	status,
	error,
}: ExecutionSectionProps) {
	if (!startedAt) return null;

	const showRunning = status === "in_progress";
	const showDuration = startedAt && finishedAt;
	const showError = status === "failed" && error;

	return (
		<div className="flex flex-col gap-2">
			<Text size="xs" variant="label">
				Execution
			</Text>

			<div className="flex flex-col gap-2">
				{/* Timeline */}
				<div className="flex items-center gap-2">
					<Clock className="h-3 w-3 text-white/40" />
					<Text size="sm" variant="muted">
						Started {formatTime(startedAt)}
						{showDuration && (
							<>
								{" · "}Finished {formatTime(finishedAt)} (
								{formatDuration(startedAt, finishedAt)})
							</>
						)}
						{showRunning && (
							<span className="ml-1 text-amber-400"> · Running...</span>
						)}
					</Text>
				</div>

				{/* Error */}
				{showError && (
					<div className="flex items-start gap-2 rounded-md bg-rose-500/10 px-3 py-2">
						<AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-400" />
						<div className="flex flex-col gap-1">
							<Badge variant="rose" className="w-fit">
								Error
							</Badge>
							<Text size="sm" variant="secondary" className="text-rose-300/80">
								{error}
							</Text>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
