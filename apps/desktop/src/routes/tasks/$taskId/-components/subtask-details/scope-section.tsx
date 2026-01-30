import { Check, Minus, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Text } from "@/components/ui/text";

interface ScopeSectionProps {
	acceptanceCriterias: string[];
	outOfScope: string[];
	steps: string[];
	onStepsChange: (steps: string[]) => void;
}

export function ScopeSection({
	acceptanceCriterias,
	outOfScope,
	steps,
	onStepsChange,
}: ScopeSectionProps) {
	const [isAddingStep, setIsAddingStep] = useState(false);
	const [newStep, setNewStep] = useState("");
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (isAddingStep && inputRef.current) {
			inputRef.current.focus();
		}
	}, [isAddingStep]);

	function handleAddStep() {
		if (!newStep.trim()) return;
		onStepsChange([...steps, newStep.trim()]);
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

	return (
		<div className="flex flex-col gap-3">
			{/* Grid 2 colunas: Steps | Acceptance Criteria */}
			<div className="grid grid-cols-2 gap-6">
				{/* Coluna 1: Steps (editável com checkboxes) */}
				<div className="flex flex-col gap-2">
					<Text size="xs" variant="label">
						Steps
					</Text>

					<div className="flex flex-col gap-1">
						{steps.map((step) => (
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

				{/* Coluna 2: Acceptance Criteria (read-only numerado) */}
				{acceptanceCriterias.length > 0 && (
					<div className="flex flex-col gap-2">
						<Text size="xs" variant="label">
							Acceptance Criteria
						</Text>
						<ol className="flex flex-col gap-1">
							{acceptanceCriterias.map((criteria, index) => (
								<li
									key={criteria}
									className="flex items-start gap-2 text-[12px] text-white/60"
								>
									<span className="text-white/30 tabular-nums">{index + 1}.</span>
									<span>{criteria}</span>
								</li>
							))}
						</ol>
					</div>
				)}
			</div>

			{/* Out of Scope */}
			{outOfScope.length > 0 && (
				<div className="flex flex-col gap-2">
					<Text size="xs" variant="label">
						Out of Scope
					</Text>

					<div className="flex flex-col gap-1 opacity-60">
						{outOfScope.map((item) => (
							<div key={item} className="flex items-center gap-2 py-0.5">
								<Minus className="h-3 w-3 shrink-0 text-white/30" />
								<Text size="sm" variant="muted" className="leading-tight">
									{item}
								</Text>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
