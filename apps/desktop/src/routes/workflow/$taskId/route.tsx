import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, Lightbulb, BookOpen, Search, Send, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Text } from "@/components/ui/text";
import { Title } from "@/components/ui/title";
import { cn } from "@/lib/utils";
import { trpc } from "../../../trpc";
import { buildInitialPrompt } from "./-components/build-prompt";

type WorkflowStep = "brainstorm" | "architecture" | "review";

const stepMeta: Record<
	WorkflowStep,
	{ label: string; icon: typeof Lightbulb; variant: "violet" | "amber" | "emerald" }
> = {
	brainstorm: { label: "Brainstorm", icon: Lightbulb, variant: "violet" },
	architecture: { label: "Architecture", icon: BookOpen, variant: "amber" },
	review: { label: "Review", icon: Search, variant: "emerald" },
};

type ModelKey = "opus-4.5" | "sonnet-4.5" | "haiku-4.5";

export const Route = createFileRoute("/workflow/$taskId")({
	validateSearch: (search: Record<string, unknown>) => ({
		step: (search.step as WorkflowStep) ?? "brainstorm",
		model: (search.model as ModelKey) ?? "sonnet-4.5",
	}),
	component: WorkflowPage,
});

type ChatMessage = {
	id: string;
	role: "user" | "assistant";
	content: string;
};

function WorkflowPage() {
	const { taskId } = Route.useParams();
	const { step, model } = Route.useSearch();

	const [task] = trpc.tasks.get.useSuspenseQuery({ id: taskId });
	const [projects] = trpc.projects.list.useSuspenseQuery();
	const project = projects.find((p) => p.id === task?.project_id);

	const [sessionId, setSessionId] = useState<string | null>(null);
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [input, setInput] = useState("");
	const [isThinking, setIsThinking] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const initialized = useRef(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);

	const createSession = trpc.ai.sessions.create.useMutation();
	const sendMessage = trpc.ai.messages.send.useMutation();

	// Auto-scroll on new messages
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages, isThinking]);

	// Initialize session and send first prompt
	useEffect(() => {
		if (initialized.current || !task || !project) return;
		initialized.current = true;

		async function init() {
			try {
				setIsThinking(true);

				const session = await createSession.mutateAsync({
					service: "claude",
					modelKey: model,
					title: `${step}: ${task!.title}`,
					scope: {
						projectId: task!.project_id,
						label: `${step}:${task!.id}`,
					},
				});

				setSessionId(session.id);

				const prompt = buildInitialPrompt(step, task!, project!);

				setMessages([
					{ id: crypto.randomUUID(), role: "user", content: prompt },
				]);

				const response = await sendMessage.mutateAsync({
					service: "claude",
					sessionId: session.id,
					content: prompt,
				});

				setMessages((prev) => [
					...prev,
					{
						id: response.id,
						role: "assistant",
						content: response.content,
					},
				]);
			} catch (err) {
				setError(
					err instanceof Error ? err.message : "Failed to start session",
				);
			} finally {
				setIsThinking(false);
			}
		}

		init();
	}, [task, project]);

	async function handleSend() {
		if (!input.trim() || !sessionId || isThinking) return;

		const content = input.trim();
		setInput("");

		const userMsg: ChatMessage = {
			id: crypto.randomUUID(),
			role: "user",
			content,
		};

		setMessages((prev) => [...prev, userMsg]);
		setIsThinking(true);
		setError(null);

		try {
			const response = await sendMessage.mutateAsync({
				service: "claude",
				sessionId,
				content,
			});

			setMessages((prev) => [
				...prev,
				{
					id: response.id,
					role: "assistant",
					content: response.content,
				},
			]);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to send message");
		} finally {
			setIsThinking(false);
		}
	}

	function handleKeyDown(e: React.KeyboardEvent) {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	}

	if (!task) {
		return <div className="px-6 py-4">Task not found</div>;
	}

	const meta = stepMeta[step];
	const Icon = meta.icon;

	return (
		<div className="flex flex-col h-[calc(100vh-45px)]">
			{/* Header */}
			<div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06]">
				<Link
					to="/tasks/$taskId"
					params={{ taskId }}
					className="text-white/40 hover:text-white/70 transition-colors"
				>
					<ArrowLeft className="h-4 w-4" />
				</Link>

				<div className="flex items-center gap-2 flex-1 min-w-0">
					<Title size="default" className="truncate">
						{task.title}
					</Title>
				</div>

				<Badge variant="default" className="py-1 px-2">
					{model}
				</Badge>

				<Badge variant={meta.variant} className="gap-1.5 py-1 px-2">
					<Icon className="h-3 w-3" />
					{meta.label}
				</Badge>
			</div>

			{/* Messages */}
			<div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
				{messages.map((msg) => (
					<MessageBubble key={msg.id} message={msg} />
				))}

				{isThinking && (
					<div className="flex items-center gap-2 text-white/40">
						<Loader2 className="h-3.5 w-3.5 animate-spin" />
						<Text size="sm" variant="muted">
							Thinking...
						</Text>
					</div>
				)}

				{error && (
					<div className="rounded-md bg-rose-500/10 border border-rose-500/20 px-3 py-2">
						<Text size="sm" className="text-rose-400">
							{error}
						</Text>
					</div>
				)}

				<div ref={messagesEndRef} />
			</div>

			{/* Input */}
			<div className="px-4 py-3 border-t border-white/[0.06]">
				<div className="flex items-end gap-2">
					<textarea
						value={input}
						onChange={(e) => setInput(e.target.value)}
						onKeyDown={handleKeyDown}
						placeholder="Type a message..."
						disabled={isThinking || !sessionId}
						rows={1}
						className="flex-1 min-h-[36px] max-h-[120px] bg-white/[0.04] border border-white/10 rounded-md px-3 py-2 text-[13px] text-white/80 placeholder:text-white/30 focus:outline-none focus:border-white/20 resize-none disabled:opacity-50"
					/>
					<button
						type="button"
						onClick={handleSend}
						disabled={!input.trim() || isThinking || !sessionId}
						className={cn(
							"flex items-center justify-center h-9 w-9 rounded-md transition-colors",
							input.trim() && !isThinking
								? "bg-white/10 text-white/70 hover:bg-white/15 hover:text-white"
								: "bg-white/[0.03] text-white/20 cursor-not-allowed",
						)}
					>
						<Send className="h-4 w-4" />
					</button>
				</div>
			</div>
		</div>
	);
}

function MessageBubble({ message }: { message: ChatMessage }) {
	const isUser = message.role === "user";

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
