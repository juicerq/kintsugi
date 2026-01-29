export type ChatMessage = {
	id: string;
	role: "user" | "assistant" | "error";
	content: string;
};
