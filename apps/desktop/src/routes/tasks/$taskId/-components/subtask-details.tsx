import { Check, Plus, StickyNote } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import { trpc } from "../../../../trpc";
import { categoryConfig } from "./category-config";
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
	const [isAddingStep, setIsAddingStep] = useState(false);
	const [newStep, setNewStep] = useState("");
	const [showNotes, setShowNotes] = useState(false);
	const [notes, setNotes] = useState(subtask.notes ?? "");
	const inputRef = useRef<HTMLInputElement>(null);

	const acceptanceCriterias = parseJsonArray(subtask.acceptance_criterias);

	useEffect(() => {
		if (isAddingStep && inputRef.current) {
			inputRef.current.focus();
		}
	}, [isAddingStep]);

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

	function updateCriterias(items: string[]) {
		updateSubtask.mutate({
			id: subtask.id,
			acceptanceCriterias: items.length > 0 ? items : null,
		});
	}

	function handleAddStep() {
		if (!newStep.trim()) return;
		updateCriterias([...acceptanceCriterias, newStep.trim()]);
		setNewStep("");
		setIsAddingStep(false);
	}

	function handleStepKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
		if (e.key === "Enter") {
			handleAddStep();
		}
		if (e.key === "Escape") {
			setNewStep("");
			setIsAddingStep(false);
		}
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

			{/* Steps */}
			<div className="flex flex-col gap-2">
				<Text size="xs" variant="label">
					Steps
				</Text>

				<div className="flex flex-col gap-1">
					{acceptanceCriterias.map((step) => (
						<div
							key={step}
							className="group/step flex items-center gap-2 rounded py-0.5"
						>
							<button
								type="button"
								className="flex h-3 w-3 shrink-0 items-center justify-center rounded-sm border border-white/40 bg-white/40 transition-all duration-150 ease-out active:scale-90"
							>
								<Check className="h-2 w-2 text-[#0a0a0a]" />
							</button>
							<Text size="sm" variant="secondary" className="leading-tight">
								{step}
							</Text>
						</div>
					))}

					{isAddingStep ? (
						<div className="flex items-center gap-2 pt-1">
							<div className="h-3 w-3 shrink-0 rounded-sm border border-white/20" />
							<input
								ref={inputRef}
								type="text"
								value={newStep}
								onChange={(e) => setNewStep(e.target.value)}
								onKeyDown={handleStepKeyDown}
								onBlur={() => {
									if (!newStep.trim()) setIsAddingStep(false);
								}}
								placeholder="Add step..."
								className="flex-1 bg-transparent text-[11px] leading-tight text-white/60 outline-none placeholder:text-white/25"
							/>
						</div>
					) : (
						<div className="flex items-center gap-2 pt-1">
							<Plus className="h-3 w-3 shrink-0 text-white/20" />
							<button
								type="button"
								onClick={() => setIsAddingStep(true)}
								className="text-[11px] text-white/25 hover:text-white/40 transition-colors"
							>
								Add step...
							</button>
						</div>
					)}
				</div>
			</div>

			<div className="h-px bg-white/[0.08]" />

			{/* Details */}
			<div className="flex flex-col gap-3">
				<Text size="xs" variant="label">
					Details
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
											onClick={() => handleCategoryChange(cat)}
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
								onCheckedChange={handleCommitChange}
							/>
						</div>

						{/* View notes button */}
						<button
							type="button"
							onClick={() => setShowNotes(!showNotes)}
							className={cn(
								"flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-medium transition-all duration-150 ease-out",
								showNotes
									? "bg-amber-500/15 text-amber-400"
									: "bg-white/5 text-white/40 hover:bg-white/8 hover:text-white/55",
							)}
						>
							<StickyNote className="h-2.5 w-2.5" />
							View notes
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
								onChange={(e) => setNotes(e.target.value)}
								onBlur={handleNotesBlur}
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
		</div>
	);
}
