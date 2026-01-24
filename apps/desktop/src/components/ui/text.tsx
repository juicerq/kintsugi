import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const textVariants = cva(
  "tracking-[-0.01em] leading-[1.4]",
  {
    variants: {
      variant: {
        default: "text-white/70",
        muted: "text-white/50",
        faint: "text-white/40",
        primary: "text-white/90",
      },
      size: {
        default: "text-[13px]",
        sm: "text-[12px]",
        xs: "text-[11px]",
        xxs: "text-[10px]",
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
  }
)

function Text({
  className,
  variant = "default",
  size = "default",
  weight = "normal",
  asChild = false,
  ...props
}: React.ComponentProps<"p"> &
  VariantProps<typeof textVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "p"

  return (
    <Comp
      data-slot="text"
      className={cn(textVariants({ variant, size, weight, className }))}
      {...props}
    />
  )
}

export { Text, textVariants }
