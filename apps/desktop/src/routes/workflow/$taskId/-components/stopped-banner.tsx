import { Play, Plus, Square } from "lucide-react";
import { Text } from "@/components/ui/text";

interface StoppedBannerProps {
	onResume: () => void;
	onNewSession: () => void;
}

export function StoppedBanner({ onResume, onNewSession }: StoppedBannerProps) {
	return (
		<div className="flex items-center justify-between px-4 py-2 bg-rose-500/10 border-b border-rose-500/20">
			<div className="flex items-center gap-2">
				<Square className="h-4 w-4 text-rose-400 fill-rose-400" />
				<Text size="sm" className="text-rose-400">
					Session stopped
				</Text>
			</div>
			<div className="flex items-center gap-2">
				<button
					type="button"
					onClick={onResume}
					className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
				>
					<Play className="h-3 w-3" />
					Resume
				</button>
				<button
					type="button"
					onClick={onNewSession}
					className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-white/10 text-white/70 hover:bg-white/15 transition-colors"
				>
					<Plus className="h-3 w-3" />
					New session
				</button>
			</div>
		</div>
	);
}
