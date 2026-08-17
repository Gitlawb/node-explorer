import { motion, useScroll, type MotionProps } from "motion/react"

import { cn } from "@/lib/utils"

interface ScrollProgressProps extends Omit<
  React.HTMLAttributes<HTMLElement>,
  keyof MotionProps
> {
  ref?: React.Ref<HTMLDivElement>
}

export function ScrollProgress({
  className,
  ref,
  ...props
}: ScrollProgressProps) {
  const { scrollYProgress } = useScroll()

  return (
    <motion.div
      ref={ref}
      className={cn(
        // Was a hardcoded purple/pink/orange gradient. This palette is
        // monochrome and inverts with the theme, so the bar is the foreground.
        "fixed inset-x-0 top-0 z-50 h-px origin-left bg-foreground",
        className
      )}
      style={{
        scaleX: scrollYProgress,
      }}
      {...props}
    />
  )
}
