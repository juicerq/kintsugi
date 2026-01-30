import {
	FileText,
	Flame,
	ListTodo,
	RefreshCw,
	Settings,
	Sparkles,
	Wrench,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import { trpc } from "../../trpc";

const BRANCH_PREFIXES = [
	{
		value: "feature",
		label: "feature",
		description: "New functionality",
		icon: Sparkles,
		color: "text-sky-400",
	},
	{
		value: "fix",
		label: "fix",
		description: "Bug fixes",
		icon: Wrench,
		color: "text-rose-400",
	},
	{
		value: "refactor",
		label: "refactor",
		description: "Code restructuring",
		icon: RefreshCw,
		color: "text-emerald-400",
	},
	{
		value: "chore",
		label: "chore",
		description: "Maintenance, configs",
		icon: Settings,
		color: "text-white/50",
	},
	{
		value: "docs",
		label: "docs",
		description: "Documentation",
		icon: FileText,
		color: "text-indigo-400",
	},
	{
		value: "hotfix",
		label: "hotfix",
		description: "Urgent fixes",
		icon: Flame,
		color: "text-amber-400",
	},
] as const;

type BranchPrefix = (typeof BRANCH_PREFIXES)[number]["value"];

interface CreateTaskModalProps {
	isOpen: boolean;
	onClose: () => void;
	projectId: string;
}

export function CreateTaskModal({
	isOpen,
	onClose,
	projectId,
}: CreateTaskModalProps) {
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [branchPrefix, setBranchPrefix] = useState<BranchPrefix>("feature");
	const [branchName, setBranchName] = useState("");
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	const utils = trpc.useUtils();

	const handleClose = useCallback(() => {
		setTitle("");
		setDescription("");
		setBranchPrefix("feature");
		setBranchName("");
		setErrorMessage(null);
		onClose();
	}, [onClose]);

	const createTask = trpc.tasks.create.useMutation({
		onSuccess: () => {
			utils.projects.listWithTasks.invalidate();
			handleClose();
		},
		onError: (error) => {
			setErrorMessage(error.message || "Failed to create task");
		},
	});

	const fullBranchName = useMemo(() => {
		if (!branchName.trim()) return undefined;
		return `${branchPrefix}/${branchName.trim()}`;
	}, [branchPrefix, branchName]);

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!title.trim()) return;
		setErrorMessage(null);
		createTask.mutate({
			projectId,
			title: title.trim(),
			description: description.trim() || undefined,
			branchName: fullBranchName,
		});
	}

	// Focus input when modal opens
	useEffect(() => {
		if (isOpen) {
			const timer = setTimeout(() => inputRef.current?.focus(), 50);
			return () => clearTimeout(timer);
		}
	}, [isOpen]);

	// Close on Escape
	useEffect(() => {
		function handleKeyDown(e: KeyboardEvent) {
			if (e.key === "Escape" && isOpen) {
				handleClose();
			}
		}
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isOpen, handleClose]);

	const isValid = title.trim().length > 0;
	const isSubmitting = createTask.isPending;

	return (
		<AnimatePresence>
			{isOpen && (
				<motion.div
					className="fixed inset-0 z-50 flex items-center justify-center"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.15 }}
				>
					{/* Overlay - glassmorphism */}
					<motion.div
						className="absolute inset-0 bg-black/50 backdrop-blur-sm"
						onClick={handleClose}
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
					/>

					{/* Modal */}
					<motion.div
						className={cn(
							"relative z-10 w-full max-w-[420px] mx-4 overflow-hidden",
							"rounded-lg border border-white/[0.08] bg-[#0d0d0e]/95",
							"shadow-2xl shadow-black/50",
						)}
						initial={{ opacity: 0, scale: 0.96, y: 8, filter: "blur(4px)" }}
						animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
						exit={{ opacity: 0, scale: 0.96, y: 8, filter: "blur(4px)" }}
						transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
					>
						{/* Radial glow at top */}
						<div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.06)_0%,transparent_70%)]" />

						{/* Header */}
						<div className="relative px-5 pt-5 pb-4 border-b border-white/[0.06]">
							<div className="flex items-center gap-2">
								<div className="relative">
									<div className="absolute inset-0 rounded-full bg-white/[0.08] blur-md scale-150" />
									<ListTodo className="relative size-4 text-white/50" />
								</div>
								<Text variant="primary" size="default" weight="medium">
									New Task
								</Text>
							</div>
						</div>

						{/* Form */}
						<form onSubmit={handleSubmit} className="px-5 pt-4 pb-5">
							<div className="space-y-4">
								{/* Title */}
								<div className="space-y-1.5">
									<Text variant="label" size="xs">
										Title
									</Text>
									<Input
										ref={inputRef}
										placeholder="Task title"
										value={title}
										onChange={(e) => setTitle(e.target.value)}
										disabled={isSubmitting}
										className="h-8 text-[12px] bg-white/[0.03] border-white/[0.08] transition-shadow duration-200 focus-visible:border-white/20 focus-visible:ring-0 focus-visible:shadow-[0_0_0_1px_rgba(255,255,255,0.15),0_0_12px_rgba(255,255,255,0.08)]"
									/>
								</div>

								{/* Description */}
								<div className="space-y-1.5">
									<Text variant="label" size="xs">
										Description
										<span className="ml-1 text-white/30">(optional)</span>
									</Text>
									<textarea
										placeholder="Brief description of what needs to be done..."
										value={description}
										onChange={(e) => setDescription(e.target.value)}
										disabled={isSubmitting}
										rows={3}
										className={cn(
											"w-full rounded-md px-3 py-2 resize-none",
											"text-[12px] bg-white/[0.03] border border-white/[0.08]",
											"placeholder:text-white/30 text-white/70",
											"transition-shadow duration-200",
											"focus-visible:outline-none focus-visible:border-white/20 focus-visible:ring-0 focus-visible:shadow-[0_0_0_1px_rgba(255,255,255,0.15),0_0_12px_rgba(255,255,255,0.08)]",
											"disabled:cursor-not-allowed disabled:opacity-50",
										)}
									/>
								</div>

								{/* Branch */}
								<div className="space-y-1.5">
									<Text variant="label" size="xs">
										Branch
										<span className="ml-1 text-white/30">(optional)</span>
									</Text>
									<div className="flex gap-2">
										<Select
											value={branchPrefix}
											onValueChange={(v) => setBranchPrefix(v as BranchPrefix)}
											disabled={isSubmitting}
										>
											<SelectTrigger className="w-[120px] shrink-0">
												{(() => {
													const selected = BRANCH_PREFIXES.find(
														(p) => p.value === branchPrefix,
													);
													if (!selected) return <SelectValue />;
													const Icon = selected.icon;
													return (
														<div className="flex items-center gap-1.5">
															<Icon className={cn("size-3", selected.color)} />
															<span>{selected.label}/</span>
														</div>
													);
												})()}
											</SelectTrigger>
											<SelectContent>
												{BRANCH_PREFIXES.map((prefix) => {
													const Icon = prefix.icon;
													return (
														<SelectItem key={prefix.value} value={prefix.value}>
															<div className="flex items-center gap-1.5">
																<Icon className={cn("size-3", prefix.color)} />
																<span>{prefix.label}/</span>
															</div>
														</SelectItem>
													);
												})}
											</SelectContent>
										</Select>
										<Input
											placeholder="branch-name"
											value={branchName}
											onChange={(e) => setBranchName(e.target.value)}
											disabled={isSubmitting}
											className="flex-1 h-7 text-[12px] bg-white/[0.03] border-white/[0.08] transition-shadow duration-200 focus-visible:border-white/20 focus-visible:ring-0 focus-visible:shadow-[0_0_0_1px_rgba(255,255,255,0.15),0_0_12px_rgba(255,255,255,0.08)]"
										/>
									</div>
									{fullBranchName && (
										<div className="mt-1.5 px-2 py-1 rounded-md bg-white/[0.03] border border-white/[0.06]">
											<Text size="xs" variant="muted" className="font-mono">
												{fullBranchName}
											</Text>
										</div>
									)}
								</div>
							</div>

							{/* Error message */}
							{errorMessage && (
								<Text variant="default" size="xs" className="text-red-400 mt-3">
									{errorMessage}
								</Text>
							)}

							{/* Actions */}
							<div className="-mx-5 px-5 flex justify-end gap-2 mt-5 pt-4 border-t border-white/[0.06]">
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onClick={handleClose}
									disabled={isSubmitting}
									className="h-7 px-3 text-[11px] text-white/50 hover:text-white/70 hover:bg-white/[0.04]"
								>
									Cancel
								</Button>
								<Button
									type="submit"
									size="sm"
									disabled={!isValid || isSubmitting}
									className={cn(
										"h-7 px-3 text-[11px]",
										"text-[#0a0a0b] hover:bg-white",
										"disabled:bg-white/20 disabled:text-white/40",
										isValid && !isSubmitting
											? "bg-[linear-gradient(110deg,rgba(255,255,255,0.9)_0%,rgba(255,255,255,1)_45%,rgba(255,255,255,0.9)_55%,rgba(255,255,255,0.9)_100%)] bg-[length:200%_100%] animate-shimmer"
											: "bg-white/90",
									)}
								>
									{isSubmitting ? "Creating..." : "Create"}
								</Button>
							</div>
						</form>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
