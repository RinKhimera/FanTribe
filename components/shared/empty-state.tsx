"use client"

import { Sparkles } from "lucide-react"
import { motion } from "motion/react"
import { cn } from "@/lib/utils"

interface EmptyStateProps {
  icon: React.ElementType
  iconBg: string
  iconColor: string
  accentGradient: string
  title: string
  description: string
}

export const EmptyState = ({
  icon: Icon,
  iconBg,
  iconColor,
  accentGradient,
  title,
  description,
}: EmptyStateProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    className="relative overflow-hidden px-4 py-4"
  >
    <div className="glass-card relative flex flex-col items-center justify-center px-6 py-12 sm:py-16">
      {/* Subtle gradient accent */}
      <div
        className={cn(
          "pointer-events-none absolute inset-0 bg-linear-to-br opacity-60",
          accentGradient,
        )}
      />

      {/* Decorative geometric elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 0.08, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="absolute -top-8 -right-8 size-32 rounded-full border-2 border-current"
          style={{ color: "var(--primary)" }}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 0.05, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="absolute top-4 -right-4 size-24 rounded-full border border-current"
          style={{ color: "var(--primary)" }}
        />
        <motion.div
          initial={{ opacity: 0, rotate: 45, scale: 0.5 }}
          animate={{ opacity: 0.06, rotate: 45, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="absolute -bottom-6 -left-6 size-20 border-2 border-current"
          style={{ color: "var(--primary)" }}
        />
      </div>

      {/* Icon with animated ring */}
      <div className="relative mb-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: [0.3, 0.1, 0.3], scale: [1, 1.2, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className={cn("absolute inset-0 rounded-2xl", iconBg)}
          style={{ margin: "-8px" }}
        />
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            delay: 0.15,
            type: "spring",
            stiffness: 260,
            damping: 20,
          }}
          className={cn(
            "relative flex size-20 items-center justify-center rounded-2xl",
            iconBg,
          )}
        >
          <Icon className={cn("size-10", iconColor)} strokeWidth={1.5} />
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, type: "spring", stiffness: 300 }}
            className="absolute -top-1 -right-1"
          >
            <Sparkles className="size-5 text-amber-400" strokeWidth={2} />
          </motion.div>
        </motion.div>
      </div>

      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4 }}
        className="mb-2 text-center text-lg font-semibold tracking-tight"
      >
        {title}
      </motion.h3>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.4 }}
        className="text-muted-foreground max-w-xs text-center text-sm leading-relaxed"
      >
        {description}
      </motion.p>

      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.5, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="via-border mt-8 h-px w-24 bg-linear-to-r from-transparent to-transparent"
      />
    </div>
  </motion.div>
)
