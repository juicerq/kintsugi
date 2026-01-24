export function DragHandle() {
	return (
		<div className="flex flex-col gap-0.5 cursor-grab pt-1 group">
			<div className="flex gap-0.5">
				<span className="h-1 w-1 rounded-full bg-white/30 group-hover:bg-white/50 transition-colors" />
				<span className="h-1 w-1 rounded-full bg-white/30 group-hover:bg-white/50 transition-colors" />
			</div>
			<div className="flex gap-0.5">
				<span className="h-1 w-1 rounded-full bg-white/30 group-hover:bg-white/50 transition-colors" />
				<span className="h-1 w-1 rounded-full bg-white/30 group-hover:bg-white/50 transition-colors" />
			</div>
			<div className="flex gap-0.5">
				<span className="h-1 w-1 rounded-full bg-white/30 group-hover:bg-white/50 transition-colors" />
				<span className="h-1 w-1 rounded-full bg-white/30 group-hover:bg-white/50 transition-colors" />
			</div>
		</div>
	);
}
