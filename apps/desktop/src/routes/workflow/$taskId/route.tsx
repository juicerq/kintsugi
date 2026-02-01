import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { modelOptions, workflowSteps } from "@/lib/consts";
import type { ModelKey, WorkflowStep } from "@/lib/types";
import { trpc } from "../../../trpc";
import { WorkflowSession } from "./-components/workflow-session";

const workflowStepKeys = workflowSteps.map((step) => step.key) as [
	WorkflowStep,
	...WorkflowStep[],
];
const modelKeys = modelOptions.map((model) => model.key) as [
	ModelKey,
	...ModelKey[],
];
const defaultWorkflowStep = workflowStepKeys[0];
const defaultModelKey = modelKeys[0];

export const Route = createFileRoute("/workflow/$taskId")({
	validateSearch: z.object({
		step: z.enum(workflowStepKeys).default(defaultWorkflowStep),
		model: z.enum(modelKeys).default(defaultModelKey),
		sessionId: z.string().optional(),
	}),
	component: WorkflowPage,
});

function WorkflowPage() {
	const { taskId } = Route.useParams();
	const { step, model, sessionId: routeSessionId } = Route.useSearch();

	const [task] = trpc.tasks.get.useSuspenseQuery({ id: taskId });
	const [projects] = trpc.projects.list.useSuspenseQuery();
	const project = projects.find((p) => p.id === task?.project_id);

	if (!task) {
		return <div className="px-6 py-4">Task not found</div>;
	}

	return (
		<WorkflowSession.Root
			taskId={taskId}
			taskTitle={task.title}
			step={step}
			model={model}
			task={task}
			project={project}
			routeSessionId={routeSessionId}
		>
			<div className="flex flex-col h-full">
				<WorkflowSession.Header />
				<WorkflowSession.StoppedBanner />
				<WorkflowSession.MessageList />
				<WorkflowSession.ChatInput />
				<WorkflowSession.SessionChoiceModal />
				<WorkflowSession.SessionHistory />
			</div>
		</WorkflowSession.Root>
	);
}
