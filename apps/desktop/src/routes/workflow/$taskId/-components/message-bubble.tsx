import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "./types";

interface MessageBubbleProps {
	message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
	const isUser = message.role === "user";
	const isError = message.role === "error";

	if (isError) {
		return (
			<div className="flex justify-end">
				<div className="max-w-[85%] rounded-lg px-3 py-2 bg-rose-500/10 border border-rose-500/30 text-rose-400">
					<div className="flex items-center gap-2 mb-1">
						<AlertCircle className="h-3.5 w-3.5" />
						<span className="text-xs font-medium">Error</span>
					</div>
					<pre className="text-[13px] leading-relaxed whitespace-pre-wrap font-sans">
						{message.content}
					</pre>
				</div>
			</div>
		);
	}

	return (
		<div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
			<div
				className={cn(
					"max-w-[85%] rounded-lg px-3 py-2",
					isUser
						? "bg-white/[0.08] text-white/80"
						: "bg-white/[0.03] text-white/70 border border-white/[0.06]",
				)}
			>
				<pre className="text-[13px] leading-relaxed whitespace-pre-wrap font-sans">
					{message.content}
				</pre>
			</div>
		</div>
	);
}
