import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Folder } from "lucide-react";
import { open } from "@tauri-apps/plugin-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { trpc } from "../../trpc";

export function CreateProjectInput() {
	const [name, setName] = useState("");
	const [path, setPath] = useState("");
	const [expanded, setExpanded] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);

	const utils = trpc.useUtils();
	const createProject = trpc.projects.create.useMutation({
		onSuccess: () => {
			utils.projects.list.invalidate();
			setName("");
			setPath("");
			setExpanded(false);
		},
	});

	async function handleSelectFolder() {
		const selected = await open({
			directory: true,
			multiple: false,
		});

		if (selected) {
			setPath(selected);
		}
	}

	function handleBlur(e: React.FocusEvent) {
		if (containerRef.current?.contains(e.relatedTarget)) return;
		if (name || path) return;
		setExpanded(false);
	}

	function handleKeyDown(e: React.KeyboardEvent) {
		if (e.key === "Enter" && name && path) {
			createProject.mutate({ name, path });
		}
	}

	return (
		<div
			ref={containerRef}
			className="mb-8"
			onBlur={handleBlur}
		>
			<Input
				placeholder="Nome do projeto..."
				value={name}
				onChange={(e) => setName(e.target.value)}
				onFocus={() => setExpanded(true)}
				onKeyDown={handleKeyDown}
			/>

			<AnimatePresence>
				{expanded && (
					<motion.div
						initial={{ opacity: 0, y: -8, height: 0 }}
						animate={{ opacity: 1, y: 0, height: "auto" }}
						exit={{ opacity: 0, y: -8, height: 0 }}
						transition={{ duration: 0.2, ease: "easeOut" }}
						className="mt-2 flex gap-2 overflow-hidden"
					>
						<Input
							value={path}
							onChange={(e) => setPath(e.target.value)}
							onKeyDown={handleKeyDown}
							placeholder="Caminho do projeto..."
							className="flex-1"
						/>
						<Button
							type="button"
							variant="outline"
							size="icon"
							onClick={handleSelectFolder}
						>
							<Folder className="h-4 w-4" />
						</Button>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
