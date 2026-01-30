import { StickyNote } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import { trpc } from "../../../../trpc";
import { categoryConfig } from "./category-config";
import { ExecutionSection } from "./subtask-details/execution-section";
import { ResultsSection } from "./subtask-details/results-section";
import { ScopeSection } from "./subtask-details/scope-section";
import { categories, type Subtask, type SubtaskCategory } from "./types";

interface SubtaskDetailsProps {
	subtask: Subtask;
}

function parseJsonArray(value: string | null): string[] {
	if (!value) return [];
	try {
		const parsed = JSON.parse(value);
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
}

export function SubtaskDetails({ subtask }: SubtaskDetailsProps) {
	const utils = trpc.useUtils();
	const [showNotes, setShowNotes] = useState(false);
	const [notes, setNotes] = useState(subtask.notes ?? "");

	const parsed = useMemo(
		() => ({
			acceptanceCriterias: parseJsonArray(subtask.acceptance_criterias),
			outOfScope: parseJsonArray(subtask.out_of_scope),
			steps: parseJsonArray(subtask.steps),
			keyDecisions: parseJsonArray(subtask.key_decisions),
			files: parseJsonArray(subtask.files),
		}),
		[
			subtask.acceptance_criterias,
			subtask.out_of_scope,
			subtask.steps,
			subtask.key_decisions,
			subtask.files,
		],
	);

	const showExecution = Boolean(subtask.started_at);
	const showResults =
		(subtask.status === "completed" || subtask.status === "failed") &&
		(parsed.keyDecisions.length > 0 || parsed.files.length > 0);

	const updateSubtask = trpc.subtasks.update.useMutation({
		onSuccess: () => {
			utils.subtasks.list.invalidate({ taskId: subtask.task_id });
		},
	});

	function handleCategoryChange(category: SubtaskCategory) {
		updateSubtask.mutate({
			id: subtask.id,
			category,
		});
	}

	function handleCommitChange(checked: boolean) {
		updateSubtask.mutate({
			id: subtask.id,
			shouldCommit: checked,
		});
	}

	function handleStepsChange(items: string[]) {
		updateSubtask.mutate({
			id: subtask.id,
			steps: items.length > 0 ? items : null,
		});
	}

	function handleNotesBlur() {
		const trimmed = notes.trim();
		if (trimmed !== (subtask.notes ?? "")) {
			updateSubtask.mutate({
				id: subtask.id,
				notes: trimmed || null,
			});
		}
	}

	return (
		<div className="flex flex-col gap-3 px-6 pb-3 pt-1">
			<div className="h-px bg-white/[0.08]" />

			{/* Scope: Acceptance Criteria + Out of Scope */}
			<ScopeSection
				acceptanceCriterias={parsed.acceptanceCriterias}
				outOfScope={parsed.outOfScope}
				steps={parsed.steps}
				onStepsChange={handleStepsChange}
			/>

			<div className="h-px bg-white/[0.08]" />

			{/* Config: Category, Commit, Notes */}
			<ConfigSection
				subtask={subtask}
				showNotes={showNotes}
				notes={notes}
				onCategoryChange={handleCategoryChange}
				onCommitChange={handleCommitChange}
				onShowNotesChange={setShowNotes}
				onNotesChange={setNotes}
				onNotesBlur={handleNotesBlur}
			/>

			{/* Execution: Timeline + Error */}
			{showExecution && (
				<>
					<div className="h-px bg-white/[0.08]" />
					<ExecutionSection
						startedAt={subtask.started_at}
						finishedAt={subtask.finished_at}
						status={subtask.status}
						error={subtask.error}
					/>
				</>
			)}

			{/* Results: Actions Taken, Key Decisions, Files */}
			{showResults && (
				<>
					<div className="h-px bg-white/[0.08]" />
					<ResultsSection
						keyDecisions={parsed.keyDecisions}
						files={parsed.files}
					/>
				</>
			)}
		</div>
	);
}

// ═══════════════════════════════════════════════════════════════════════════════
// ConfigSection - Category, Commit, Notes
// ═══════════════════════════════════════════════════════════════════════════════

interface ConfigSectionProps {
	subtask: Subtask;
	showNotes: boolean;
	notes: string;
	onCategoryChange: (category: SubtaskCategory) => void;
	onCommitChange: (checked: boolean) => void;
	onShowNotesChange: (show: boolean) => void;
	onNotesChange: (notes: string) => void;
	onNotesBlur: () => void;
}

function ConfigSection({
	subtask,
	showNotes,
	notes,
	onCategoryChange,
	onCommitChange,
	onShowNotesChange,
	onNotesChange,
	onNotesBlur,
}: ConfigSectionProps) {
	return (
		<div className="flex flex-col gap-3">
			<Text size="xs" variant="label">
				Config
			</Text>

			<div className="flex flex-col gap-2.5">
				<div className="flex flex-wrap items-center gap-4">
					{/* Category */}
					<div className="flex items-center gap-2">
						<Text size="sm" variant="muted">
							Category
						</Text>
						<div className="flex flex-wrap gap-1">
							{categories.map((cat) => {
								const config = categoryConfig[cat];
								const isSelected = subtask.category === cat;
								return (
									<button
										key={cat}
										type="button"
										onClick={() => onCategoryChange(cat)}
										className={cn(
											"flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-all duration-150 ease-out",
											isSelected
												? config.activeStyle
												: "bg-white/5 text-white/40 hover:bg-white/8 hover:text-white/55",
										)}
									>
										{config.icon}
										{config.label}
									</button>
								);
							})}
						</div>
					</div>

					{/* Commit */}
					<div className="flex items-center gap-2">
						<Text size="sm" variant="muted">
							Commit
						</Text>
						<Switch
							checked={subtask.should_commit === 1}
							onCheckedChange={onCommitChange}
						/>
					</div>

					{/* View notes button */}
					<button
						type="button"
						onClick={() => onShowNotesChange(!showNotes)}
						className={cn(
							"flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-medium transition-all duration-150 ease-out",
							showNotes
								? "bg-amber-500/15 text-amber-400"
								: "bg-white/5 text-white/40 hover:bg-white/8 hover:text-white/55",
						)}
					>
						<StickyNote className="h-2.5 w-2.5" />
						Notes
					</button>
				</div>
			</div>

			{/* Notes (collapsible) */}
			<AnimatePresence>
				{showNotes && (
					<motion.div
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: "auto" }}
						exit={{ opacity: 0, height: 0 }}
						transition={{ duration: 0.15 }}
					>
						<textarea
							value={notes}
							onChange={(e) => onNotesChange(e.target.value)}
							onBlur={onNotesBlur}
							placeholder="Add notes..."
							rows={2}
							className={cn(
								"w-full bg-white/[0.03] border border-white/[0.06] rounded-md px-3 py-2",
								"text-[12px] text-white/70 placeholder:text-white/25",
								"resize-none outline-none",
								"focus:border-white/15 focus:bg-white/[0.05]",
								"transition-colors",
							)}
						/>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
