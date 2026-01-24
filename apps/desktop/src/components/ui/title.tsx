import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const titleVariants = cva(
  "font-medium text-white/90 tracking-[-0.01em] leading-[1.4]",
  {
    variants: {
      size: {
        xl: "text-[20px]",
        lg: "text-[16px]",
        default: "text-[13px]",
        sm: "text-[12px]",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

function Title({
  className,
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
      className={cn(titleVariants({ size, className }))}
      {...props}
    />
  )
}

export { Title, titleVariants }
