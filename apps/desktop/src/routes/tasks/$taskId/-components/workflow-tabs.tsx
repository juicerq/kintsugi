import { useState } from "react";
import { WorkflowEditor } from "./workflow-editor";

type WorkflowTab = "brainstorm" | "architecture" | "review";

interface WorkflowTabsProps {
	task: {
		id: string;
		brainstorm: string | null;
		architecture: string | null;
		review: string | null;
	};
}

const tabs: { key: WorkflowTab; label: string; color: string }[] = [
	{ key: "brainstorm", label: "Brainstorm", color: "bg-purple-500" },
	{ key: "architecture", label: "Architecture", color: "bg-amber-500" },
	{ key: "review", label: "Review", color: "bg-green-500" },
];

export function WorkflowTabs({ task }: WorkflowTabsProps) {
	const [activeTab, setActiveTab] = useState<WorkflowTab>("brainstorm");

	return (
		<div className="space-y-4">
			<div className="flex gap-2">
				{tabs.map((tab) => (
					<button
						key={tab.key}
						type="button"
						onClick={() => setActiveTab(tab.key)}
						className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
							activeTab === tab.key
								? "bg-white/10 text-white"
								: "text-white/50 hover:text-white/70"
						}`}
					>
						<span className={`w-2 h-2 rounded-full ${tab.color}`} />
						{tab.label}
					</button>
				))}
			</div>
			<WorkflowEditor task={task} activeTab={activeTab} />
		</div>
	);
}
