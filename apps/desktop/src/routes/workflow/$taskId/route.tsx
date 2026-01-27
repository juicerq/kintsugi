import { createFileRoute, Link } from "@tanstack/react-router";
import {
	AlertCircle,
	ArrowLeft,
	History,
	Play,
	Plus,
	Send,
	Square,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Text } from "@/components/ui/text";
import { ThinkingAnimation } from "@/components/ui/thinking-animation";
import { Title } from "@/components/ui/title";
import { workflowSteps } from "@/lib/consts";
import type { ModelKey, SessionSummary, WorkflowStep } from "@/lib/types";
import { cn } from "@/lib/utils";
import { trpc } from "../../../trpc";
import { buildInitialPrompt } from "./-components/build-prompt";
import { SessionChoiceModal } from "./-components/session-choice-modal";
import { SessionHistory } from "./-components/session-history";

const stepMeta = Object.fromEntries(
	workflowSteps.map((s) => [
		s.key,
		{ label: s.label, icon: s.icon, variant: s.variant },
	]),
) as Record<
	WorkflowStep,
	{
		label: string;
		icon: (typeof workflowSteps)[number]["icon"];
		variant: "violet" | "amber" | "emerald";
	}
>;

export const Route = createFileRoute("/workflow/$taskId")({
	validateSearch: (search: Record<string, unknown>) => ({
		step: (search.step as WorkflowStep) ?? "brainstorm",
		model: (search.model as ModelKey) ?? "opus-4.5",
		sessionId: (search.sessionId as string | undefined) ?? undefined,
	}),
	component: WorkflowPage,
});

type ChatMessage = {
	id: string;
	role: "user" | "assistant" | "error";
	content: string;
};

function WorkflowPage() {
	const { taskId } = Route.useParams();
	const { step, model, sessionId: routeSessionId } = Route.useSearch();

	const [task] = trpc.tasks.get.useSuspenseQuery({ id: taskId });
	const [projects] = trpc.projects.list.useSuspenseQuery();
	const project = projects.find((p) => p.id === task?.project_id);

	const [sessionId, setSessionId] = useState<string | null>(null);
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [input, setInput] = useState("");
	const [isThinking, setIsThinking] = useState(false);
	const [isStopped, setIsStopped] = useState(false);
	const [showSessionModal, setShowSessionModal] = useState(false);
	const [showHistory, setShowHistory] = useState(false);
	const [existingSessions, setExistingSessions] = useState<SessionSummary[]>(
		[],
	);
	const [isLoading, setIsLoading] = useState(true);

	const initialized = useRef(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);

	const utils = trpc.useUtils();
	const createSession = trpc.ai.sessions.create.useMutation();
	const sendMessage = trpc.ai.messages.send.useMutation();
	const stopSession = trpc.ai.sessions.stop.useMutation();
	const resumeSession = trpc.ai.sessions.resume.useMutation();

	// Auto-scroll on new messages
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages, isThinking]);

	// Initialize session
	useEffect(() => {
		if (initialized.current || !task || !project) return;
		initialized.current = true;

		// If a sessionId was passed via URL, load it directly
		if (routeSessionId) {
			loadSession(routeSessionId);
			return;
		}

		// Otherwise check for existing sessions
		checkExistingSessions();
	}, [task, project, step, taskId, routeSessionId]);

	async function checkExistingSessions() {
		setIsLoading(true);
		try {
			const sessions = await utils.ai.sessions.listByScope.fetch({
				service: "claude",
				scope: {
					projectId: task!.project_id,
					label: `${step}:${taskId}`,
				},
				limit: 10,
			});

			if (sessions && sessions.length > 0) {
				setExistingSessions(sessions as SessionSummary[]);
				setShowSessionModal(true);
			} else {
				await startNewSession();
			}
		} catch (err) {
			appendError(
				err instanceof Error ? err.message : "Failed to initialize session",
			);
		} finally {
			setIsLoading(false);
		}
	}

	async function startNewSession() {
		if (!task || !project) return;

		try {
			setIsThinking(true);
			setIsStopped(false);
			setIsLoading(false);

			const session = await createSession.mutateAsync({
				service: "claude",
				modelKey: model,
				title: `${step}: ${task.title}`,
				scope: {
					projectId: task.project_id,
					label: `${step}:${task.id}`,
				},
			});

			setSessionId(session.id);

			const prompt = buildInitialPrompt(step, task, project);

			setMessages([{ id: crypto.randomUUID(), role: "user", content: prompt }]);

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
			appendError(
				err instanceof Error ? err.message : "Failed to create session",
			);
		} finally {
			setIsThinking(false);
		}
	}

	async function loadSession(targetSessionId: string) {
		setShowSessionModal(false);
		setShowHistory(false);
		setSessionId(targetSessionId);
		setIsLoading(true);
		setIsStopped(false);

		try {
			const msgs = await utils.ai.messages.list.fetch({
				service: "claude",
				sessionId: targetSessionId,
			});

			if (msgs) {
				setMessages(
					msgs.map((m) => ({
						id: m.id,
						role: m.role as "user" | "assistant",
						content: m.content,
					})),
				);
			}
		} catch (err) {
			appendError(
				err instanceof Error ? err.message : "Failed to load session messages",
			);
		} finally {
			setIsLoading(false);
		}
	}

	function appendError(message: string) {
		setMessages((prev) => [
			...prev,
			{ id: crypto.randomUUID(), role: "error", content: message },
		]);
	}

	async function handleSend() {
		if (!input.trim() || !sessionId || isThinking || isStopped) return;

		const content = input.trim();
		setInput("");

		setMessages((prev) => [
			...prev,
			{ id: crypto.randomUUID(), role: "user", content },
		]);
		setIsThinking(true);

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
			const errorMsg =
				err instanceof Error ? err.message : "Failed to send message";

			if (errorMsg.includes("stopped") || errorMsg.includes("paused")) {
				setIsStopped(true);
			}

			appendError(errorMsg);
		} finally {
			setIsThinking(false);
		}
	}

	async function handleStop() {
		if (!sessionId) return;

		try {
			await stopSession.mutateAsync({
				service: "claude",
				sessionId,
			});
			setIsStopped(true);
			setIsThinking(false);
		} catch (err) {
			appendError(
				err instanceof Error ? err.message : "Failed to stop session",
			);
		}
	}

	async function handleResume() {
		if (!sessionId) return;

		try {
			await resumeSession.mutateAsync({
				service: "claude",
				sessionId,
			});
			setIsStopped(false);
		} catch (err) {
			appendError(
				err instanceof Error ? err.message : "Failed to resume session",
			);
		}
	}

	function handleKeyDown(e: React.KeyboardEvent) {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	}

	async function handleShowHistory() {
		// Refresh session list before showing history
		try {
			const sessions = await utils.ai.sessions.listByScope.fetch({
				service: "claude",
				scope: {
					projectId: task!.project_id,
					label: `${step}:${taskId}`,
				},
				limit: 10,
			});
			setExistingSessions((sessions as SessionSummary[]) ?? []);
		} catch {
			// Use whatever we already have
		}
		setShowHistory(true);
	}

	if (!task) {
		return <div className="px-6 py-4">Task not found</div>;
	}

	const meta = stepMeta[step];
	const Icon = meta.icon;

	return (
		<div className="flex flex-col h-full">
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

				{sessionId && (
					<button
						type="button"
						onClick={handleShowHistory}
						className="p-1.5 rounded-md text-white/40 hover:bg-white/10 hover:text-white/70 transition-colors"
						title="View sessions"
					>
						<History className="h-4 w-4" />
					</button>
				)}
			</div>

			{/* Stopped Banner */}
			{isStopped && (
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
							onClick={handleResume}
							className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
						>
							<Play className="h-3 w-3" />
							Resume
						</button>
						<button
							type="button"
							onClick={() => {
								setShowSessionModal(false);
								setShowHistory(false);
								startNewSession();
							}}
							className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-white/10 text-white/70 hover:bg-white/15 transition-colors"
						>
							<Plus className="h-3 w-3" />
							New session
						</button>
					</div>
				</div>
			)}

			{/* Messages */}
			<div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
				{isLoading && !showSessionModal ? (
					<div className="flex items-center justify-center h-full">
						<ThinkingAnimation />
					</div>
				) : (
					<>
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
					</>
				)}
			</div>

			{/* Input */}
			<div className="px-4 py-3 border-t border-white/[0.06]">
				<div className="flex items-end gap-2">
					<textarea
						value={input}
						onChange={(e) => setInput(e.target.value)}
						onKeyDown={handleKeyDown}
						placeholder={
							isStopped
								? "Session stopped. Resume or start a new one."
								: "Type a message..."
						}
						disabled={isThinking || !sessionId || isStopped || isLoading}
						rows={1}
						className="flex-1 min-h-[36px] max-h-[120px] bg-white/[0.04] border border-white/10 rounded-md px-3 py-2 text-[13px] text-white/80 placeholder:text-white/30 focus:outline-none focus:border-white/20 resize-none disabled:opacity-50"
					/>
					{isThinking ? (
						<button
							type="button"
							onClick={handleStop}
							className="flex items-center justify-center h-9 w-9 rounded-md bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 transition-colors"
							title="Stop session"
						>
							<Square className="h-4 w-4 fill-rose-400" />
						</button>
					) : (
						<button
							type="button"
							onClick={handleSend}
							disabled={!input.trim() || !sessionId || isStopped || isLoading}
							className={cn(
								"flex items-center justify-center h-9 w-9 rounded-md transition-colors",
								input.trim() && !isStopped && !isLoading
									? "bg-white/10 text-white/70 hover:bg-white/15 hover:text-white"
									: "bg-white/[0.03] text-white/20 cursor-not-allowed",
							)}
						>
							<Send className="h-4 w-4" />
						</button>
					)}
				</div>
			</div>

			{/* Session Choice Modal (only when no sessionId in URL) */}
			<SessionChoiceModal
				isOpen={showSessionModal}
				onClose={() => setShowSessionModal(false)}
				sessions={existingSessions}
				step={step}
				onContinueSession={(id) => {
					setShowSessionModal(false);
					loadSession(id);
				}}
				onStartNewSession={() => {
					setShowSessionModal(false);
					startNewSession();
				}}
			/>

			{/* Session History Modal */}
			<SessionHistory
				isOpen={showHistory}
				onClose={() => setShowHistory(false)}
				sessions={existingSessions}
				step={step}
				onSelectSession={(id) => {
					setShowHistory(false);
					loadSession(id);
				}}
			/>
		</div>
	);
}

function MessageBubble({ message }: { message: ChatMessage }) {
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
