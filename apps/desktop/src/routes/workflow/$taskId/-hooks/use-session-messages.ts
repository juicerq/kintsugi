import type { RouterOutputs } from "@kintsugi/shared";
import { useCallback, useState } from "react";
import type { ChatMessage } from "../-components/types";

export type DbMessage = RouterOutputs["ai"]["messages"]["list"][number];

function extractThinkingFromRaw(raw: unknown): string[] {
	if (!raw || !Array.isArray(raw)) return [];

	const thinkingBlocks: string[] = [];

	for (const msg of raw) {
		const content = msg?.message?.content;
		if (!content || !Array.isArray(content)) continue;

		for (const block of content) {
			if (block.type === "thinking" && typeof block.thinking === "string") {
				thinkingBlocks.push(block.thinking);
			}
		}
	}

	return thinkingBlocks;
}

function mapDbMessageToChatMessage(msg: DbMessage): ChatMessage {
	const thinking = extractThinkingFromRaw(msg.raw);

	return {
		id: msg.id,
		role: msg.role as "user" | "assistant",
		content: msg.content,
		...(thinking.length > 0 && { thinking }),
	};
}

export function useSessionMessages() {
	const [messages, setMessages] = useState<ChatMessage[]>([]);

	const appendUserMessage = useCallback((content: string): string => {
		const id = crypto.randomUUID();
		setMessages((prev) => [...prev, { id, role: "user", content }]);
		return id;
	}, []);

	const appendAssistantMessage = useCallback((id: string, content: string) => {
		setMessages((prev) => [...prev, { id, role: "assistant", content }]);
	}, []);

	const appendError = useCallback((message: string) => {
		setMessages((prev) => [
			...prev,
			{ id: crypto.randomUUID(), role: "error", content: message },
		]);
	}, []);

	const setMessagesFromDb = useCallback((dbMessages: DbMessage[]) => {
		setMessages(dbMessages.map(mapDbMessageToChatMessage));
	}, []);

	return {
		messages,
		appendUserMessage,
		appendAssistantMessage,
		appendError,
		setMessagesFromDb,
	};
}

export type SessionMessages = ReturnType<typeof useSessionMessages>;
