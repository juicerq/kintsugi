import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { serviceOptions } from "@/lib/consts";
import type { ServiceKey } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ServiceSelectorProps {
	value: ServiceKey;
	onChange: (service: ServiceKey) => void;
}

export function ServiceSelector({ value, onChange }: ServiceSelectorProps) {
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);

	const selected = serviceOptions.find((s) => s.key === value) ?? serviceOptions[0];

	useEffect(() => {
		if (!open) return;

		function handleClickOutside(e: MouseEvent) {
			if (ref.current && !ref.current.contains(e.target as Node)) {
				setOpen(false);
			}
		}

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [open]);

	return (
		<div ref={ref} className="relative">
			<Badge
				variant="default"
				onClick={() => setOpen((o) => !o)}
				className="cursor-pointer gap-1.5 rounded-md py-1 px-2 hover:bg-white/15 active:bg-white/20"
			>
				<span className={cn("w-1.5 h-1.5 rounded-full", selected.dotColor)} />
				{selected.label}
				<ChevronDown
					className={cn(
						"h-2.5 w-2.5 opacity-50 transition-transform",
						open && "rotate-180",
					)}
				/>
			</Badge>

			{open && (
				<div className="absolute right-0 top-full mt-1 z-50 min-w-[120px] rounded-md border border-white/10 bg-[#1a1a1a] py-1 shadow-xl">
					{serviceOptions.map((service) => (
						<button
							key={service.key}
							type="button"
							onClick={() => {
								setOpen(false);
								onChange(service.key);
							}}
							className={cn(
								"flex w-full items-center gap-2 px-3 py-1.5 text-[11px] text-white/70 hover:bg-white/10 hover:text-white/90 transition-colors",
								service.key === value && "bg-white/5 text-white/90",
							)}
						>
							<span
								className={cn("w-1.5 h-1.5 rounded-full", service.dotColor)}
							/>
							{service.label}
						</button>
					))}
				</div>
			)}
		</div>
	);
}
