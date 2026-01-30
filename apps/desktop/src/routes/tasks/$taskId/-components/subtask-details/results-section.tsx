import { ChevronDown, FileCode2, Lightbulb } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";

interface ResultsSectionProps {
	keyDecisions: string[];
	files: string[];
}

const FILES_COLLAPSE_THRESHOLD = 10;

export function ResultsSection({
	keyDecisions,
	files,
}: ResultsSectionProps) {
	const hasDecisions = keyDecisions.length > 0;
	const hasFiles = files.length > 0;

	if (!hasDecisions && !hasFiles) return null;

	return (
		<div className="flex flex-col gap-3">
			<Text size="xs" variant="label">
				Results
			</Text>

			<div className="flex flex-col gap-3">
				{/* Key Decisions */}
				{hasDecisions && (
					<div className="flex flex-col gap-1.5">
						<div className="flex items-center gap-1.5">
							<Lightbulb className="h-3 w-3 text-white/40" />
							<Text size="xs" variant="muted">
								Key Decisions
							</Text>
						</div>
						<ul className="flex flex-col gap-0.5 pl-4.5">
							{keyDecisions.map((decision) => (
								<li
									key={decision}
									className="flex items-start gap-2 text-[12px] text-white/60"
								>
									<span className="text-white/30">•</span>
									<span>{decision}</span>
								</li>
							))}
						</ul>
					</div>
				)}

				{/* Files Modified */}
				{hasFiles && <FilesCollapsible files={files} />}
			</div>
		</div>
	);
}

function FilesCollapsible({ files }: { files: string[] }) {
	const shouldCollapse = files.length > FILES_COLLAPSE_THRESHOLD;
	const [isExpanded, setIsExpanded] = useState(!shouldCollapse);

	const visibleFiles = isExpanded ? files : files.slice(0, 5);

	return (
		<div className="flex flex-col gap-1.5">
			<button
				type="button"
				onClick={() => shouldCollapse && setIsExpanded(!isExpanded)}
				className={cn(
					"flex items-center gap-1.5",
					shouldCollapse && "cursor-pointer hover:opacity-80",
				)}
			>
				<FileCode2 className="h-3 w-3 text-white/40" />
				<Text size="xs" variant="muted">
					Files Modified ({files.length})
				</Text>
				{shouldCollapse && (
					<ChevronDown
						className={cn(
							"h-3 w-3 text-white/30 transition-transform duration-150",
							isExpanded && "rotate-180",
						)}
					/>
				)}
			</button>

			<AnimatePresence initial={false}>
				<motion.ul
					initial={false}
					animate={{ height: "auto" }}
					className={cn(
						"flex flex-col gap-0.5 pl-4.5 overflow-hidden",
						shouldCollapse && !isExpanded && "max-h-[120px]",
						shouldCollapse && isExpanded && "max-h-[300px] overflow-y-auto",
					)}
				>
					{visibleFiles.map((file) => (
						<li
							key={file}
							className="flex items-start gap-2 text-[12px] text-white/50 font-mono"
						>
							<span className="text-white/25">•</span>
							<span className="truncate">{file}</span>
						</li>
					))}
					{!isExpanded && files.length > 5 && (
						<li className="text-[11px] text-white/30 italic">
							+{files.length - 5} more files...
						</li>
					)}
				</motion.ul>
			</AnimatePresence>
		</div>
	);
}
