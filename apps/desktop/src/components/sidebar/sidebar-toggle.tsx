import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidebarToggleProps {
	isCollapsed: boolean;
	onToggle: () => void;
}

export function SidebarToggle({ isCollapsed, onToggle }: SidebarToggleProps) {
	return (
		<Button
			variant="ghost"
			size="icon-xs"
			onClick={onToggle}
			className={cn(
				"absolute -right-3 top-4 z-10 h-6 w-6 rounded-full border border-sidebar-border bg-sidebar transition-colors",
				"hover:bg-sidebar-accent",
			)}
			aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
		>
			{isCollapsed ? (
				<ChevronRight className="h-3.5 w-3.5 text-white/60" />
			) : (
				<ChevronLeft className="h-3.5 w-3.5 text-white/60" />
			)}
		</Button>
	);
}
