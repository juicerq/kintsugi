import { ChevronDown, Play, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { modelOptions } from "@/lib/consts";
import type { ModelKey } from "@/lib/types";
import { cn } from "@/lib/utils";

interface RunAllButtonProps {
	isExecuting: boolean;
	onRun: (modelKey: ModelKey) => void;
	onStop: () => void;
}

export function RunAllButton({
	isExecuting,
	onRun,
	onStop,
}: RunAllButtonProps) {
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

	if (isExecuting) {
		return (
			<Badge
				variant="rose"
				onClick={onStop}
				className="cursor-pointer gap-1 rounded-md py-1 px-2 hover:bg-rose-500/25 active:bg-rose-500/35"
			>
				<Square className="h-2.5 w-2.5 fill-rose-400" />
				Stop
			</Badge>
		);
	}

	return (
		<div ref={ref} className="relative">
			<Badge
				variant="emerald"
				onClick={() => setOpen((o) => !o)}
				className="cursor-pointer gap-1 rounded-md py-1 px-2 hover:bg-emerald-500/25 active:bg-emerald-500/35"
			>
				<Play className="h-2.5 w-2.5 fill-emerald-400" />
				Run all
				<ChevronDown
					className={cn(
						"h-2.5 w-2.5 opacity-50 transition-transform",
						open && "rotate-180",
					)}
				/>
			</Badge>

			{open && (
				<div className="absolute right-0 top-full mt-1 z-50 min-w-[160px] rounded-md border border-white/10 bg-[#1a1a1a] py-1 shadow-xl">
					{modelOptions.map((model) => (
						<button
							key={model.key}
							type="button"
							onClick={() => {
								setOpen(false);
								onRun(model.key);
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
