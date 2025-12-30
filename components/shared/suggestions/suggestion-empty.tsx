"use client"

import { motion } from "motion/react"
import { Users } from "lucide-react"
import { cn } from "@/lib/utils"

export const SuggestionEmpty = () => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      className={cn(
        "flex flex-col items-center justify-center py-12 px-6",
        "glass-card rounded-xl text-center",
        "border border-primary/10"
      )}
    >
      {/* Animated icon container */}
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.1, duration: 0.5, type: "spring", bounce: 0.4 }}
        className="relative mb-5"
      >
        {/* Glow ring */}
        <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl scale-150" />

        {/* Icon container */}
        <div className={cn(
          "relative h-16 w-16 rounded-full",
          "bg-gradient-to-br from-primary/20 to-primary/5",
          "flex items-center justify-center",
          "ring-1 ring-primary/20"
        )}>
          <Users className="h-7 w-7 text-primary" />
        </div>
      </motion.div>

      <motion.h4
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="font-semibold text-foreground mb-1.5"
      >
        Aucune suggestion disponible
      </motion.h4>

      <motion.p
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-sm text-muted-foreground max-w-[200px] leading-relaxed"
      >
        Revenez plus tard pour decouvrir de nouveaux createurs
      </motion.p>
    </motion.div>
  )
}
