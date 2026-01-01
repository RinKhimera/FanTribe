"use client"

import { motion } from "motion/react"

interface FormSectionProps {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
  delay?: number
}

export const FormSection = ({
  icon,
  title,
  children,
  delay = 0,
}: FormSectionProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="glass-card space-y-4 rounded-2xl p-5"
  >
    <div className="flex items-center gap-2 text-sm font-medium">
      <span className="text-primary">{icon}</span>
      <span>{title}</span>
    </div>
    {children}
  </motion.div>
)
