import { createContext, type ReactNode, useContext, useState } from "react";
import type { ModelKey, Project, Task, WorkflowStep } from "@/lib/types";
import { useWorkflowSession } from "../-hooks/use-workflow-session";
import { ChatInput } from "./chat-input";
import { MessageList } from "./message-list";
import { SessionChoiceModal } from "./session-choice-modal";
import { SessionHistory } from "./session-history";
import { StoppedBanner } from "./stopped-banner";
import { WorkflowHeader } from "./workflow-header";

interface WorkflowSessionContextValue {
	taskId: string;
	taskTitle: string;
	model: ModelKey;
	step: WorkflowStep;
	session: ReturnType<typeof useWorkflowSession>;
}

const WorkflowSessionContext =
	createContext<WorkflowSessionContextValue | null>(null);

function useWorkflowSessionContext() {
	const context = useContext(WorkflowSessionContext);
	if (!context) {
		throw new Error("WorkflowSession must be used within WorkflowSession.Root");
	}
	return context;
}

interface WorkflowSessionRootProps {
	taskId: string;
	taskTitle: string;
	step: WorkflowStep;
	model: ModelKey;
	task: Task | undefined;
	project: Project | undefined;
	routeSessionId?: string;
	children: ReactNode;
}

function WorkflowSessionRoot({
	taskId,
	taskTitle,
	step,
	model,
	task,
	project,
	routeSessionId,
	children,
}: WorkflowSessionRootProps) {
	const session = useWorkflowSession({
		task,
		project,
		step,
		model,
		routeSessionId,
	});

	const value = {
		taskId,
		taskTitle,
		model,
		step,
		session,
	};

	return (
		<WorkflowSessionContext.Provider value={value}>
			{children}
		</WorkflowSessionContext.Provider>
	);
}

function WorkflowSessionHeader() {
	const {
		taskId,
		taskTitle,
		model,
		step,
		session: { header },
	} = useWorkflowSessionContext();

	return (
		<WorkflowHeader
			taskId={taskId}
			taskTitle={taskTitle}
			model={model}
			step={step}
			hasSession={header.hasSession}
			onShowHistory={header.onShowHistory}
		/>
	);
}

function WorkflowSessionStoppedBanner() {
	const {
		session: { stoppedBanner },
	} = useWorkflowSessionContext();

	if (!stoppedBanner.isVisible) return null;

	return (
		<StoppedBanner
			onResume={stoppedBanner.onResume}
			onNewSession={stoppedBanner.onNewSession}
		/>
	);
}

function WorkflowSessionMessageList() {
	const {
		session: { messageList },
	} = useWorkflowSessionContext();

	return <MessageList {...messageList} />;
}

function WorkflowSessionChatInput() {
	const {
		session: { chatInput },
	} = useWorkflowSessionContext();
	const [input, setInput] = useState("");

	function handleSend() {
		if (!input.trim()) return;
		void chatInput.sendMessage(input.trim());
		setInput("");
	}

	return (
		<ChatInput
			input={input}
			onInputChange={setInput}
			onSend={handleSend}
			onStop={chatInput.onStop}
			isThinking={chatInput.isThinking}
			isStopped={chatInput.isStopped}
			disabled={chatInput.disabled}
		/>
	);
}

function WorkflowSessionChoiceModal() {
	const {
		step,
		session: {
			modals: { sessionChoice },
		},
	} = useWorkflowSessionContext();

	return (
		<SessionChoiceModal
			isOpen={sessionChoice.isOpen}
			onClose={sessionChoice.onClose}
			sessions={sessionChoice.sessions}
			step={step}
			onContinueSession={sessionChoice.onContinueSession}
			onStartNewSession={sessionChoice.onStartNewSession}
		/>
	);
}

function WorkflowSessionHistoryModal() {
	const {
		step,
		session: {
			modals: { history },
		},
	} = useWorkflowSessionContext();

	return (
		<SessionHistory
			isOpen={history.isOpen}
			onClose={history.onClose}
			sessions={history.sessions}
			step={step}
			onSelectSession={history.onSelectSession}
		/>
	);
}

export const WorkflowSession = {
	Root: WorkflowSessionRoot,
	Header: WorkflowSessionHeader,
	StoppedBanner: WorkflowSessionStoppedBanner,
	MessageList: WorkflowSessionMessageList,
	ChatInput: WorkflowSessionChatInput,
	SessionChoiceModal: WorkflowSessionChoiceModal,
	SessionHistory: WorkflowSessionHistoryModal,
};
