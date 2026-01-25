import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Title Component - Para headings e títulos
 *
 * Variants controlam opacidade para estados visuais:
 * - default: white/90 (normal)
 * - muted: white/50 (completed/disabled)
 */
const titleVariants = cva(
  "font-medium tracking-[-0.01em] leading-[1.4]",
  {
    variants: {
      variant: {
        default: "text-white/90",
        muted: "text-white/50",
      },
      size: {
        xl: "text-[19px]",
        lg: "text-[15px]",
        default: "text-[12px]",
        sm: "text-[11px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Title({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"h2"> &
  VariantProps<typeof titleVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "h2"

  return (
    <Comp
      data-slot="title"
      className={cn(titleVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Title, titleVariants }
