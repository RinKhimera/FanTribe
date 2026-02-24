"use client"

import { motion } from "motion/react"
import { cn } from "@/lib/utils"

type PostComposerFrameProps = {
  children: React.ReactNode
  className?: string
}

export function PostComposerFrame({ children, className }: PostComposerFrameProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="p-4"
    >
      <div
        className={cn(
          "relative rounded-2xl",
          "glass-premium",
          "border-primary/10 border",
          "p-4 md:p-5",
          className,
        )}
      >
        {children}
      </div>
    </motion.div>
  )
}
