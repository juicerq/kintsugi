import { cn } from "@/lib/utils";

interface ThinkingAnimationProps {
	className?: string;
}

export function ThinkingAnimation({ className }: ThinkingAnimationProps) {
	return (
		<div className={cn("flex items-center gap-1.5", className)}>
			<div className="flex items-center gap-1">
				<span
					className="w-2 h-2 rounded-full bg-[#d4af37] animate-kintsugi-pulse"
					style={{ animationDelay: "0ms" }}
				/>
				<span
					className="w-2 h-2 rounded-full bg-[#d4af37] animate-kintsugi-pulse"
					style={{ animationDelay: "150ms" }}
				/>
				<span
					className="w-2 h-2 rounded-full bg-[#d4af37] animate-kintsugi-pulse"
					style={{ animationDelay: "300ms" }}
				/>
			</div>
		</div>
	);
}
