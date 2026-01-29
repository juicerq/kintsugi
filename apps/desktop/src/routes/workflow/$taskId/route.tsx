import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import type { ModelKey, WorkflowStep } from "@/lib/types";
import { trpc } from "../../../trpc";
import { ChatInput } from "./-components/chat-input";
import { MessageList } from "./-components/message-list";
import { SessionChoiceModal } from "./-components/session-choice-modal";
import { SessionHistory } from "./-components/session-history";
import { StoppedBanner } from "./-components/stopped-banner";
import { WorkflowHeader } from "./-components/workflow-header";
import { useWorkflowSession } from "./-hooks/use-workflow-session";

export const Route = createFileRoute("/workflow/$taskId")({
	validateSearch: (search: Record<string, unknown>) => ({
		step: (search.step as WorkflowStep) ?? "brainstorm",
		model: (search.model as ModelKey) ?? "opus-4.5",
		sessionId: (search.sessionId as string | undefined) ?? undefined,
	}),
	component: WorkflowPage,
});

function WorkflowPage() {
	const { taskId } = Route.useParams();
	const { step, model, sessionId: routeSessionId } = Route.useSearch();

	const [task] = trpc.tasks.get.useSuspenseQuery({ id: taskId });
	const [projects] = trpc.projects.list.useSuspenseQuery();
	const project = projects.find((p) => p.id === task?.project_id);

	const [input, setInput] = useState("");

	const session = useWorkflowSession({
		task,
		project,
		step,
		model,
		routeSessionId,
	});

	if (!task) {
		return <div className="px-6 py-4">Task not found</div>;
	}

	function handleSend() {
		if (!input.trim()) return;
		session.sendMessage(input.trim());
		setInput("");
	}

	return (
		<div className="flex flex-col h-full">
			<WorkflowHeader
				taskId={taskId}
				taskTitle={task.title}
				model={model}
				step={step}
				hasSession={!!session.sessionId}
				onShowHistory={session.handleShowHistory}
			/>

			{session.isStopped && (
				<StoppedBanner
					onResume={session.resumeSession}
					onNewSession={session.startNewSession}
				/>
			)}

			<MessageList
				messages={session.messages}
				isLoading={session.isLoading}
				isThinking={session.isThinking}
				showSessionModal={session.showSessionModal}
			/>

			<ChatInput
				input={input}
				onInputChange={setInput}
				onSend={handleSend}
				onStop={session.stopSession}
				isThinking={session.isThinking}
				isStopped={session.isStopped}
				disabled={!session.sessionId || session.isLoading}
			/>

			<SessionChoiceModal
				isOpen={session.showSessionModal}
				onClose={() => session.setShowSessionModal(false)}
				sessions={session.existingSessions}
				step={step}
				onContinueSession={session.loadSession}
				onStartNewSession={session.startNewSession}
			/>

			<SessionHistory
				isOpen={session.showHistory}
				onClose={() => session.setShowHistory(false)}
				sessions={session.existingSessions}
				step={step}
				onSelectSession={session.loadSession}
			/>
		</div>
	);
}
