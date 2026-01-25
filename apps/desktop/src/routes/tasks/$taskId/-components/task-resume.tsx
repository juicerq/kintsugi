import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";

interface TaskResumeProps {
	task: {
		id: string;
		project_id: string;
		title: string;
		description: string | null;
		branch_name: string | null;
		brainstorm: string | null;
		architecture: string | null;
		review: string | null;
		created_at: string;
		completed_at: string | null;
	};
	completedSubtasks?: number;
	totalSubtasks?: number;
}

export function TaskResume({ task }: TaskResumeProps) {
	const workflowStages = [
		{
			key: "brainstorm",
			hasContent: !!task.brainstorm,
			color: "bg-purple-500",
			fadedColor: "bg-purple-500/30",
			label: "Brainstorm",
		},
		{
			key: "architecture",
			hasContent: !!task.architecture,
			color: "bg-amber-500",
			fadedColor: "bg-amber-500/30",
			label: "Architecture",
		},
		{
			key: "review",
			hasContent: !!task.review,
			color: "bg-green-500",
			fadedColor: "bg-green-500/30",
			label: "Review",
		},
	];

	// const completedStages = workflowStages.filter((s) => s.hasContent).length;

	return (
		<div className="transition-colors p-3 rounded-md bg-white/3 hover:bg-white/4">
			<div className="grid grid-cols-3">
				{workflowStages.map((stage) => (
					<div key={stage.key}>
						<div className="flex items-center gap-1.5">
							<Text>{stage.label}</Text>
							<div
								className={cn(
									"size-1.5 rounded-full",
									stage.hasContent && stage.color,
									!stage.hasContent && stage.fadedColor,
								)}
							/>
						</div>
					</div>
				))}
			</div>

			<div className="flex justify-between h-full w-full items-center gap-1.5">
				<Text>WIPZÃO</Text>
			</div>
		</div>
	);
}
