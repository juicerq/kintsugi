export function DragHandle() {
	return (
		<div className="flex flex-col gap-0.5 cursor-grab pt-1">
			<div className="flex gap-0.5">
				<span className="h-1 w-1 rounded-full bg-muted-foreground/50" />
				<span className="h-1 w-1 rounded-full bg-muted-foreground/50" />
			</div>
			<div className="flex gap-0.5">
				<span className="h-1 w-1 rounded-full bg-muted-foreground/50" />
				<span className="h-1 w-1 rounded-full bg-muted-foreground/50" />
			</div>
			<div className="flex gap-0.5">
				<span className="h-1 w-1 rounded-full bg-muted-foreground/50" />
				<span className="h-1 w-1 rounded-full bg-muted-foreground/50" />
			</div>
		</div>
	);
}
