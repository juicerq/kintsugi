import { ChevronDown, Play, Square } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	modelOptionsClaude,
	modelOptionsOpencode,
	serviceOptions,
} from "@/lib/consts";
import type { ModelKey, ServiceKey } from "@/lib/types";
import { cn } from "@/lib/utils";

interface RunAllButtonProps {
	isExecuting: boolean;
	onRun: (service: ServiceKey, modelKey: ModelKey) => void;
	onStop: () => void;
}

export function RunAllButton({
	isExecuting,
	onRun,
	onStop,
}: RunAllButtonProps) {
	const [open, setOpen] = useState(false);

	if (isExecuting) {
		return (
			<Badge
				variant="rose"
				onClick={onStop}
				className="cursor-pointer gap-1 rounded-md py-1 px-2 hover:bg-rose-500/25 active:bg-rose-500/35"
			>
				<Square className="h-2.5 w-2.5 fill-rose-400" />
				Stop
			</Badge>
		);
	}

	return (
		<DropdownMenu open={open} onOpenChange={setOpen}>
			<DropdownMenuTrigger asChild>
				<Badge
					variant="emerald"
					className="cursor-pointer gap-1 rounded-md py-1 px-2 hover:bg-emerald-500/25 active:bg-emerald-500/35"
				>
					<Play className="h-2.5 w-2.5 fill-emerald-400" />
					Run all
					<ChevronDown className="h-2.5 w-2.5 opacity-50" />
				</Badge>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="end"
				side="bottom"
				sideOffset={4}
				className="w-[160px]"
				onCloseAutoFocus={(e) => e.preventDefault()}
			>
				{serviceOptions.map((service) => (
					<DropdownMenuSub key={service.key}>
						<DropdownMenuSubTrigger className="gap-2 text-xs text-white/70">
							<span
								className={cn("h-1.5 w-1.5 rounded-full", service.dotColor)}
							/>
							{service.label}
						</DropdownMenuSubTrigger>
						<DropdownMenuSubContent className="w-[160px]">
							{(service.key === "claude"
								? modelOptionsClaude
								: modelOptionsOpencode
							).map((model) => (
								<DropdownMenuItem
									key={model.key}
									className="gap-2 text-xs text-white/70 focus:text-white/90"
									onClick={() => {
										setOpen(false);
										onRun(service.key, model.key);
									}}
								>
									<span
										className={cn("h-1.5 w-1.5 rounded-full", model.dotColor)}
									/>
									{model.label}
								</DropdownMenuItem>
							))}
						</DropdownMenuSubContent>
					</DropdownMenuSub>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
