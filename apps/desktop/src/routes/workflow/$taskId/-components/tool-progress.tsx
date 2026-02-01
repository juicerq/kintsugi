import { Loader2, Wrench } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ToolProgressProps {
	toolName: string;
	startedAt?: number;
}

export function ToolProgress({ toolName, startedAt }: ToolProgressProps) {
	const [elapsed, setElapsed] = useState(0);

	useEffect(() => {
		if (!startedAt) return;

		const interval = setInterval(() => {
			setElapsed(Math.floor((Date.now() - startedAt) / 1000));
		}, 1000);

		return () => clearInterval(interval);
	}, [startedAt]);

	const formatElapsed = (seconds: number): string => {
		if (seconds < 60) return `${seconds}s`;
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}m ${secs}s`;
	};

	return (
		<div className="flex justify-start">
			<div
				className={cn(
					"inline-flex items-center gap-2 px-3 py-2 rounded-lg",
					"bg-amber-500/10 border border-amber-500/20",
				)}
			>
				<Loader2 className="h-3.5 w-3.5 text-amber-400 animate-spin" />
				<div className="flex items-center gap-1.5">
					<Wrench className="h-3 w-3 text-amber-400/70" />
					<span className="text-xs font-medium text-amber-400">{toolName}</span>
				</div>
				{startedAt && elapsed > 0 && (
					<span className="text-[11px] text-amber-400/60 ml-1">
						{formatElapsed(elapsed)}
					</span>
				)}
			</div>
		</div>
	);
}
