import { Send, Square } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
	input: string;
	onInputChange: (value: string) => void;
	onSend: () => void;
	onStop: () => void;
	isThinking: boolean;
	isStopped: boolean;
	disabled: boolean;
}

export function ChatInput({
	input,
	onInputChange,
	onSend,
	onStop,
	isThinking,
	isStopped,
	disabled,
}: ChatInputProps) {
	function handleKeyDown(e: React.KeyboardEvent) {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			onSend();
		}
	}

	return (
		<div className="px-4 py-3 border-t border-white/[0.06]">
			<div className="flex items-end gap-2">
				<textarea
					value={input}
					onChange={(e) => onInputChange(e.target.value)}
					onKeyDown={handleKeyDown}
					placeholder={
						isStopped
							? "Session stopped. Resume or start a new one."
							: "Type a message..."
					}
					disabled={disabled}
					rows={1}
					className="flex-1 min-h-[36px] max-h-[120px] bg-white/[0.04] border border-white/10 rounded-md px-3 py-2 text-[13px] text-white/80 placeholder:text-white/30 focus:outline-none focus:border-white/20 resize-none disabled:opacity-50"
				/>
				{isThinking ? (
					<button
						type="button"
						onClick={onStop}
						className="flex items-center justify-center h-9 w-9 rounded-md bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 transition-colors"
						title="Stop session"
					>
						<Square className="h-4 w-4 fill-rose-400" />
					</button>
				) : (
					<button
						type="button"
						onClick={onSend}
						disabled={!input.trim() || isStopped || disabled}
						className={cn(
							"flex items-center justify-center h-9 w-9 rounded-md transition-colors",
							input.trim() && !isStopped && !disabled
								? "bg-white/10 text-white/70 hover:bg-white/15 hover:text-white"
								: "bg-white/[0.03] text-white/20 cursor-not-allowed",
						)}
					>
						<Send className="h-4 w-4" />
					</button>
				)}
			</div>
		</div>
	);
}
