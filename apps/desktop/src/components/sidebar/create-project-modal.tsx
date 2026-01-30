import { open } from "@tauri-apps/plugin-dialog";
import { Folder } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import { trpc } from "../../trpc";

interface CreateProjectModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export function CreateProjectModal({
	isOpen,
	onClose,
}: CreateProjectModalProps) {
	const [name, setName] = useState("");
	const [path, setPath] = useState("");
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	const utils = trpc.useUtils();

	const handleClose = useCallback(() => {
		setName("");
		setPath("");
		setErrorMessage(null);
		onClose();
	}, [onClose]);

	const createProject = trpc.projects.create.useMutation({
		onSuccess: () => {
			utils.projects.listWithTasks.invalidate();
			handleClose();
		},
		onError: (error) => {
			setErrorMessage(error.message || "Failed to create project");
		},
	});

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!name.trim() || !path.trim()) return;
		setErrorMessage(null);
		createProject.mutate({ name: name.trim(), path: path.trim() });
	}

	async function handleSelectFolder() {
		const selected = await open({
			directory: true,
			multiple: false,
		});
		if (selected) {
			setPath(selected);
			// If name is empty, derive from folder name
			if (!name.trim()) {
				const folderName = selected.split("/").pop() || "";
				setName(folderName);
			}
		}
	}

	// Focus input when modal opens
	useEffect(() => {
		if (isOpen) {
			// Small delay to ensure animation has started
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

	const isValid = name.trim() && path.trim();
	const isSubmitting = createProject.isPending;

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
					{/* Overlay */}
					<motion.div
						className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
						onClick={handleClose}
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
					/>

					{/* Modal */}
					<motion.div
						className={cn(
							"relative z-10 w-full max-w-[380px] mx-4",
							"rounded-lg border border-white/[0.08] bg-[#0d0d0e]",
							"shadow-2xl shadow-black/50",
						)}
						initial={{ opacity: 0, scale: 0.96, y: 8 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.96, y: 8 }}
						transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
					>
						{/* Header */}
						<div className="px-5 pt-5 pb-4 border-b border-white/[0.06]">
							<div className="flex items-center gap-2">
								<Folder className="size-4 text-white/40" />
								<Text variant="primary" size="default" weight="medium">
									New Project
								</Text>
							</div>
						</div>

						{/* Form */}
						<form onSubmit={handleSubmit} className="px-5 pt-4 pb-5">
							<div className="space-y-3">
								{/* Name input */}
								<div className="space-y-1.5">
									<Text variant="label" size="xs">
										Name
									</Text>
									<Input
										ref={inputRef}
										placeholder="Project name"
										value={name}
										onChange={(e) => setName(e.target.value)}
										disabled={isSubmitting}
										className="h-8 text-[12px] bg-white/[0.03] border-white/[0.08] focus-visible:border-white/20 focus-visible:ring-white/10"
									/>
								</div>

								{/* Path input */}
								<div className="space-y-1.5">
									<Text variant="label" size="xs">
										Path
									</Text>
									<div className="flex gap-2">
										<Input
											placeholder="Select folder"
											value={path}
											onChange={(e) => setPath(e.target.value)}
											disabled={isSubmitting}
											className="flex-1 h-8 text-[12px] bg-white/[0.03] border-white/[0.08] focus-visible:border-white/20 focus-visible:ring-white/10"
										/>
										<Button
											type="button"
											variant="ghost"
											size="icon-xs"
											onClick={handleSelectFolder}
											disabled={isSubmitting}
											className="h-8 w-8 shrink-0 border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/15"
										>
											<Folder className="size-3.5 text-white/50" />
										</Button>
									</div>
								</div>
							</div>

							{/* Error message */}
							{errorMessage && (
								<Text variant="default" size="xs" className="text-red-400 mt-2">
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
										"bg-white/90 text-[#0a0a0b] hover:bg-white",
										"disabled:bg-white/20 disabled:text-white/40",
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
