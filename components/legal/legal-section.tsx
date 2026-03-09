"use client"

import { LucideIcon } from "lucide-react"
import { motion } from "motion/react"
import {
  legalContainerVariants,
  legalIconVariants,
  legalListItemVariants,
  legalSectionVariants,
} from "@/lib/animations"
import { cn } from "@/lib/utils"

type LegalSectionProps = {
  id?: string
  icon?: LucideIcon
  title: string
  children: React.ReactNode
  className?: string
}

export const LegalSection = ({
  id,
  icon: Icon,
  title,
  children,
  className,
}: LegalSectionProps) => {
  return (
    <motion.section
      id={id}
      variants={legalSectionVariants}
      className={cn(
        // Glass effect with subtle gradient
        "group relative overflow-hidden rounded-2xl",
        "from-card/80 via-card/60 to-card/40 bg-linear-to-br",
        "border-border/40 border",
        "p-6 sm:p-8",
        // Subtle shadow and glow
        "shadow-lg shadow-black/5 dark:shadow-black/20",
        // Hover effect
        "transition-[border-color,box-shadow] duration-300",
        "hover:border-border/60 hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-black/30",
        className,
      )}
    >
      {/* Background gradient orb */}
      <div
        className={cn(
          "absolute -top-20 -right-20 h-40 w-40 rounded-full",
          "bg-primary/5 blur-3xl",
          "transition-opacity duration-500",
          "opacity-0 group-hover:opacity-100",
        )}
      />

      {/* Section header */}
      <div className="relative mb-6 flex items-center gap-4">
        {Icon && (
          <motion.div
            variants={legalIconVariants}
            whileHover="hover"
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
              "from-primary/15 to-primary/5 bg-linear-to-br",
              "border-primary/20 border",
              "shadow-primary/10 shadow-sm",
            )}
          >
            <Icon className="text-primary h-5 w-5" />
          </motion.div>
        )}
        <h2
          className={cn(
            "text-xl font-bold tracking-tight sm:text-2xl",
            "leading-tight",
          )}
        >
          {title}
        </h2>
      </div>

      {/* Section content */}
      <motion.div
        variants={legalContainerVariants}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, margin: "-50px" }}
        className="relative space-y-4"
      >
        {children}
      </motion.div>
    </motion.section>
  )
}

type LegalSubSectionProps = {
  title: string
  children: React.ReactNode
  className?: string
}

export const LegalSubSection = ({
  title,
  children,
  className,
}: LegalSubSectionProps) => {
  return (
    <div className={cn("space-y-3", className)}>
      <h3 className="text-foreground text-lg font-semibold">{title}</h3>
      {children}
    </div>
  )
}

type LegalTextProps = {
  children: React.ReactNode
  className?: string
}

export const LegalText = ({ children, className }: LegalTextProps) => {
  return (
    <p className={cn("text-muted-foreground leading-relaxed", className)}>
      {children}
    </p>
  )
}

type LegalListProps = {
  items: React.ReactNode[]
  className?: string
}

export const LegalList = ({ items, className }: LegalListProps) => {
  return (
    <motion.ul
      variants={legalContainerVariants}
      className={cn("ml-1 space-y-2.5", className)}
    >
      {items.map((item, index) => (
        <motion.li
          key={index}
          variants={legalListItemVariants}
          className={cn("text-muted-foreground flex items-start gap-3", "pl-1")}
        >
          <span
            className={cn(
              "mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full",
              "bg-primary/60",
            )}
          />
          <span className="leading-relaxed">{item}</span>
        </motion.li>
      ))}
    </motion.ul>
  )
}

type LegalHighlightProps = {
  children: React.ReactNode
  variant?: "default" | "info" | "warning"
  className?: string
}

export const LegalHighlight = ({
  children,
  variant = "default",
  className,
}: LegalHighlightProps) => {
  return (
    <div
      className={cn(
        "rounded-xl p-4",
        "border",
        variant === "default" && ["bg-muted/30 border-border/50"],
        variant === "info" && ["bg-primary/5 border-primary/20"],
        variant === "warning" && ["border-amber-500/20 bg-amber-500/5"],
        className,
      )}
    >
      {children}
    </div>
  )
}

type LegalLinkProps = {
  href: string
  children: React.ReactNode
  className?: string
}

export const LegalLink = ({ href, children, className }: LegalLinkProps) => {
  return (
    <a
      href={href}
      className={cn(
        "text-primary font-medium",
        "decoration-primary/30 underline underline-offset-2",
        "transition-colors duration-200",
        "hover:decoration-primary/60",
        className,
      )}
    >
      {children}
    </a>
  )
}
