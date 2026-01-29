import { useEffect, useRef } from "react";
import { ThinkingAnimation } from "@/components/ui/thinking-animation";
import { MessageBubble } from "./message-bubble";
import type { ChatMessage } from "./types";

interface MessageListProps {
	messages: ChatMessage[];
	isLoading: boolean;
	isThinking: boolean;
	showSessionModal: boolean;
}

export function MessageList({
	messages,
	isLoading,
	isThinking,
	showSessionModal,
}: MessageListProps) {
	const messagesEndRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages, isThinking]);

	if (isLoading && !showSessionModal) {
		return (
			<div className="flex-1 overflow-y-auto px-4 py-4">
				<div className="flex items-center justify-center h-full">
					<ThinkingAnimation />
				</div>
			</div>
		);
	}

	return (
		<div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
			{messages.map((msg) => (
				<MessageBubble key={msg.id} message={msg} />
			))}

			{isThinking && (
				<div className="flex justify-start">
					<div className="max-w-[85%] rounded-lg px-3 py-2 bg-white/[0.03] border border-white/[0.06]">
						<ThinkingAnimation />
					</div>
				</div>
			)}

			<div ref={messagesEndRef} />
		</div>
	);
}
