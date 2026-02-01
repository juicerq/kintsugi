import { Brain, ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ThinkingBlockProps {
	content: string;
	isActive?: boolean;
}

export function ThinkingBlock({
	content,
	isActive = false,
}: ThinkingBlockProps) {
	const [isExpanded, setIsExpanded] = useState(true);

	return (
		<div className="flex justify-start">
			<div
				className={cn(
					"max-w-[85%] rounded-lg border overflow-hidden",
					"bg-violet-500/5 border-violet-500/20",
				)}
			>
				{/* Header - always visible */}
				<button
					type="button"
					onClick={() => setIsExpanded(!isExpanded)}
					className={cn(
						"w-full flex items-center gap-2 px-3 py-2",
						"hover:bg-violet-500/10 transition-colors duration-150",
					)}
				>
					<Brain
						className={cn(
							"h-3.5 w-3.5 text-violet-400",
							isActive && "animate-pulse",
						)}
					/>
					<span className="text-xs font-medium text-violet-400">
						{isActive ? "Thinking..." : "Thought process"}
					</span>
					<ChevronDown
						className={cn(
							"h-3 w-3 text-violet-400/60 ml-auto transition-transform duration-150",
							isExpanded && "rotate-180",
						)}
					/>
				</button>

				{/* Content - collapsible */}
				<AnimatePresence initial={false}>
					{isExpanded && (
						<motion.div
							initial={{ height: 0, opacity: 0 }}
							animate={{ height: "auto", opacity: 1 }}
							exit={{ height: 0, opacity: 0 }}
							transition={{ duration: 0.15 }}
							className="overflow-hidden"
						>
							<div className="px-3 pb-2 border-t border-violet-500/10">
								<pre className="text-[12px] leading-relaxed text-white/60 whitespace-pre-wrap font-sans max-h-[300px] overflow-y-auto pt-2">
									{content}
								</pre>
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</div>
	);
}
