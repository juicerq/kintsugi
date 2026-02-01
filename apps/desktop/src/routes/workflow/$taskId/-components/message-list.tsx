import { Fragment, useEffect, useRef } from "react";
import { ThinkingAnimation } from "@/components/ui/thinking-animation";
import { MessageBubble } from "./message-bubble";
import { ThinkingBlock } from "./thinking-block";
import { ToolProgress } from "./tool-progress";
import type { ChatMessage, ThinkingState } from "./types";

interface ActiveTool {
	toolId: string;
	toolName: string;
	startedAt: number;
}

interface MessageListProps {
	messages: ChatMessage[];
	isLoading: boolean;
	isThinking: boolean;
	showSessionModal: boolean;
	thinking?: ThinkingState | null;
	activeTools?: ActiveTool[];
}

export function MessageList({
	messages,
	isLoading,
	isThinking,
	showSessionModal,
	thinking,
	activeTools = [],
}: MessageListProps) {
	const messagesEndRef = useRef<HTMLDivElement>(null);

	// biome-ignore lint/correctness/useExhaustiveDependencies: scroll on messages/isThinking/streaming changes is intentional
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages, isThinking, thinking, activeTools]);

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
				<Fragment key={msg.id}>
					{/* Persisted thinking blocks BEFORE message content (chronological order) */}
					{msg.thinking?.map((content, idx) => (
						<ThinkingBlock
							key={`${msg.id}-thinking-${idx}`}
							content={content}
							isActive={false}
						/>
					))}
					<MessageBubble message={msg} />
				</Fragment>
			))}

			{/* Live streaming thinking (still in progress) */}
			{thinking?.content && (
				<ThinkingBlock
					content={thinking.content}
					isActive={thinking.status !== "completed"}
				/>
			)}

			{/* Active tools - shows tools currently being executed */}
			{activeTools.map((tool) => (
				<ToolProgress
					key={tool.toolId}
					toolName={tool.toolName}
					startedAt={tool.startedAt}
				/>
			))}

			{/* Fallback thinking animation when no detailed thinking/tools but still processing */}
			{isThinking && !thinking && activeTools.length === 0 && (
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
