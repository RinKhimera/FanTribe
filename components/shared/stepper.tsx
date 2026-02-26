"use client"

import { motion } from "motion/react"
import { Check, LucideIcon } from "lucide-react"
import { stepperCircleVariants, stepperLineVariants } from "@/lib/animations"
import { cn } from "@/lib/utils"

export interface StepConfig {
  title: string
  icon: LucideIcon
}

interface StepperProps {
  steps: StepConfig[]
  currentStep: number // 1-based
  className?: string
}

export const Stepper = ({ steps, currentStep, className }: StepperProps) => {
  return (
    <div className={cn("glass-premium mb-8 rounded-xl p-4 md:p-6", className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const stepNumber = index + 1
          const isActive = stepNumber === currentStep
          const isCompleted = stepNumber < currentStep
          const isLast = index === steps.length - 1
          const Icon = step.icon

          return (
            <div
              key={stepNumber}
              className={cn("flex items-center", !isLast && "flex-1")}
            >
              {/* Step circle */}
              <div className="flex flex-col items-center">
                <motion.div
                  variants={stepperCircleVariants}
                  initial="inactive"
                  animate={
                    isActive ? "active" : isCompleted ? "completed" : "inactive"
                  }
                  className={cn(
                    "relative flex size-10 items-center justify-center rounded-full transition-colors md:size-12",
                    isActive && "btn-premium shadow-[var(--shadow-gold-glow)]",
                    isCompleted &&
                      "border-2 border-[var(--gold-400)] bg-[var(--gold-400)]/10",
                    !isActive &&
                      !isCompleted &&
                      "border border-muted-foreground/30 bg-muted/50",
                  )}
                >
                  {isCompleted ? (
                    <Check className="size-5 text-[var(--gold-400)]" />
                  ) : (
                    <Icon
                      className={cn(
                        "size-5",
                        isActive
                          ? "text-[oklch(0.15_0.02_60)]"
                          : "text-muted-foreground",
                      )}
                    />
                  )}
                </motion.div>

                {/* Step title — hidden on mobile */}
                <span
                  className={cn(
                    "mt-2 hidden text-xs font-medium md:block",
                    isActive && "text-gold-gradient",
                    isCompleted && "text-[var(--gold-400)]",
                    !isActive && !isCompleted && "text-muted-foreground",
                  )}
                >
                  {step.title}
                </span>
              </div>

              {/* Progress line */}
              {!isLast && (
                <div className="relative mx-2 h-0.5 flex-1 bg-muted/50 md:mx-4">
                  <motion.div
                    variants={stepperLineVariants}
                    initial="incomplete"
                    animate={isCompleted ? "complete" : "incomplete"}
                    className="absolute inset-0 bg-gradient-to-r from-[var(--gold-400)] to-[var(--gold-500)]"
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
