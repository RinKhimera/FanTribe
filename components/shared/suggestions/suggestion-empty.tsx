"use client"

import { Users } from "lucide-react"
import { motion } from "motion/react"
import { cn } from "@/lib/utils"

export const SuggestionEmpty = () => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      className={cn(
        "flex flex-col items-center justify-center px-6 py-12",
        "glass-card rounded-xl text-center",
        "border-primary/10 border",
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
        <div className="bg-primary/20 absolute inset-0 scale-150 rounded-full blur-xl" />

        {/* Icon container */}
        <div
          className={cn(
            "relative h-16 w-16 rounded-full",
            "from-primary/20 to-primary/5 bg-linear-to-br",
            "flex items-center justify-center",
            "ring-primary/20 ring-1",
          )}
        >
          <Users className="text-primary h-7 w-7" />
        </div>
      </motion.div>

      <motion.h4
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-foreground mb-1.5 font-semibold"
      >
        Aucune suggestion disponible
      </motion.h4>

      <motion.p
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-muted-foreground max-w-[200px] text-sm leading-relaxed"
      >
        Revenez plus tard pour decouvrir de nouveaux createurs
      </motion.p>
    </motion.div>
  )
}
