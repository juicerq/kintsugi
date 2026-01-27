import { useState } from "react";
import { workflowSteps } from "@/lib/consts";
import type { Task, WorkflowStep } from "@/lib/types";
import { WorkflowEditor } from "./workflow-editor";

interface WorkflowTabsProps {
	task: Task;
}

export function WorkflowTabs({ task }: WorkflowTabsProps) {
	const [activeTab, setActiveTab] = useState<WorkflowStep>("brainstorm");

	return (
		<div className="space-y-4">
			<div className="flex gap-2">
				{workflowSteps.map((step) => (
					<button
						key={step.key}
						type="button"
						onClick={() => setActiveTab(step.key)}
						className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
							activeTab === step.key
								? "bg-white/10 text-white"
								: "text-white/50 hover:text-white/70"
						}`}
					>
						<step.icon className="w-3 h-3" />
						{step.label}
					</button>
				))}
			</div>
			<WorkflowEditor task={task} activeTab={activeTab} />
		</div>
	);
}
