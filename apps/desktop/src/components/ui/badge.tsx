import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Badge Component - Para labels de status, categorias, tags
 *
 * Cores por tipo:
 * | Variant   | Cor                              | Uso                    |
 * |-----------|----------------------------------|------------------------|
 * | default   | white/10 + white/40              | Neutro, waiting        |
 * | sky       | sky-500/15 + sky-400             | Code                   |
 * | violet    | violet-500/15 + violet-400       | Test                   |
 * | indigo    | indigo-500/15 + indigo-400       | Docs                   |
 * | rose      | rose-500/15 + rose-400           | Fix                    |
 * | emerald   | emerald-500/15 + emerald-400     | Refactor, completed    |
 * | amber     | amber-500/15 + amber-400         | In progress, warning   |
 */
const badgeVariants = cva(
	"inline-flex shrink-0 items-center gap-1 rounded-lg px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider",
	{
		variants: {
			variant: {
				default: "bg-white/3 text-white/50 border border-white/10",
				sky: "bg-sky-500/15 text-sky-400 border border-sky-500/10",
				violet: "bg-violet-500/15 text-violet-400 border border-violet-500/10",
				indigo: "bg-indigo-500/15 text-indigo-400 border border-indigo-500/10",
				rose: "bg-rose-500/15 text-rose-400 border border-rose-500/10",
				emerald:
					"bg-emerald-500/15 text-emerald-400 border border-emerald-500/10",
				amber: "bg-amber-500/15 text-amber-400 border border-amber-500/10",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	},
);

function Badge({
	className,
	variant = "default",
	asChild = false,
	...props
}: React.ComponentProps<"span"> &
	VariantProps<typeof badgeVariants> & {
		asChild?: boolean;
	}) {
	const Comp = asChild ? Slot : "span";

	return (
		<Comp
			data-slot="badge"
			className={cn(badgeVariants({ variant, className }))}
			{...props}
		/>
	);
}

export { Badge, badgeVariants };
