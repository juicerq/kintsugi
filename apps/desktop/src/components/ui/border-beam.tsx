import { cn } from "@/lib/utils";

interface BorderBeamProps {
	children: React.ReactNode;
	active?: boolean;
	className?: string;
}

export function BorderBeam({
	children,
	active = false,
	className,
}: BorderBeamProps) {
	if (!active) {
		return <>{children}</>;
	}

	return (
		<div className={cn("relative rounded-md p-px overflow-hidden", className)}>
			<div className="absolute inset-0 animate-border-beam bg-[conic-gradient(transparent_270deg,rgba(255,255,255,0.5)_330deg,rgba(167,243,208,0.6)_345deg,rgba(255,255,255,0.5)_360deg,transparent_90deg)]" />
			<div className="relative rounded-md bg-[#0a0a0b]">{children}</div>
		</div>
	);
}
