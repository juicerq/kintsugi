import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Text Component - Hierarquia de opacidade (do mais sutil ao mais forte):
 *
 * | Variant   | Opacity | Uso                                    |
 * |-----------|---------|----------------------------------------|
 * | label     | 35%     | Section headers (Steps, Details, Task) |
 * | faint     | 40%     | IDs, timestamps, metadata              |
 * | muted     | 50%     | Texto secundário, placeholders         |
 * | secondary | 60%     | Steps, conteúdo expandido              |
 * | default   | 70%     | Corpo principal                        |
 * | primary   | 90%     | Títulos, texto de destaque             |
 */
const textVariants = cva("tracking-[-0.01em] leading-[1.4]", {
	variants: {
		variant: {
			label: "text-white/35 tracking-wider font-medium",
			faint: "text-white/40",
			muted: "text-white/50",
			secondary: "text-white/60",
			default: "text-white/70",
			primary: "text-white/90",
		},
		size: {
			default: "text-[12px]",
			sm: "text-[11px]",
			xs: "text-[10px]",
			xxs: "text-[9px]",
		},
		weight: {
			normal: "font-normal",
			medium: "font-medium",
		},
	},
	defaultVariants: {
		variant: "default",
		size: "default",
		weight: "normal",
	},
});

function Text({
	className,
	variant = "default",
	size = "default",
	weight = "normal",
	asChild = false,
	...props
}: React.ComponentProps<"p"> &
	VariantProps<typeof textVariants> & {
		asChild?: boolean;
	}) {
	const Comp = asChild ? Slot : "p";

	return (
		<Comp
			data-slot="text"
			className={cn(textVariants({ variant, size, weight, className }))}
			{...props}
		/>
	);
}

export { Text, textVariants };
