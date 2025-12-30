"use client"

import { motion } from "motion/react"
import {
  BadgeCheck,
  Crown,
  Flame,
  Rocket,
  Sparkles,
} from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { badgePulseVariants } from "@/lib/animations"
import { cn } from "@/lib/utils"

type BadgeType =
  | "verified"
  | "top_creator"
  | "founding_member"
  | "popular"
  | "rising_star"

interface Badge {
  type: BadgeType
  awardedAt: number
}

interface UserProfileBadgesProps {
  badges?: Badge[]
  size?: "sm" | "md" | "lg"
}

const badgeConfig: Record<
  BadgeType,
  {
    icon: React.ComponentType<{ className?: string }>
    label: string
    description: string
    className: string
    bgClassName: string
  }
> = {
  verified: {
    icon: BadgeCheck,
    label: "Vérifié",
    description: "Compte vérifié officiellement",
    className: "text-blue-500",
    bgClassName: "bg-blue-500/10",
  },
  top_creator: {
    icon: Crown,
    label: "Top Créateur",
    description: "Parmi les meilleurs créateurs de la plateforme",
    className: "text-amber-500",
    bgClassName: "bg-amber-500/10",
  },
  founding_member: {
    icon: Sparkles,
    label: "Membre Fondateur",
    description: "A rejoint la plateforme dès le début",
    className: "text-purple-500",
    bgClassName: "bg-purple-500/10",
  },
  popular: {
    icon: Flame,
    label: "Populaire",
    description: "Contenu très apprécié par la communauté",
    className: "text-orange-500",
    bgClassName: "bg-orange-500/10",
  },
  rising_star: {
    icon: Rocket,
    label: "Étoile Montante",
    description: "Créateur en forte croissance",
    className: "text-emerald-500",
    bgClassName: "bg-emerald-500/10",
  },
}

const sizeClasses = {
  sm: "size-5",
  md: "size-6",
  lg: "size-8",
}

const containerSizeClasses = {
  sm: "size-7",
  md: "size-9",
  lg: "size-12",
}

export const UserProfileBadges = ({
  badges,
  size = "md",
}: UserProfileBadgesProps) => {
  if (!badges || badges.length === 0) return null

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex flex-wrap gap-2">
        {badges.map((badge, index) => {
          const config = badgeConfig[badge.type]
          if (!config) return null

          const Icon = config.icon

          return (
            <Tooltip key={badge.type}>
              <TooltipTrigger asChild>
                <motion.div
                  variants={badgePulseVariants}
                  initial="initial"
                  animate="animate"
                  whileHover={{ scale: 1.15, rotate: 5 }}
                  transition={{
                    delay: index * 0.1,
                    type: "spring",
                    stiffness: 400,
                  }}
                  className={cn(
                    "flex cursor-pointer items-center justify-center rounded-xl transition-shadow hover:shadow-lg",
                    config.bgClassName,
                    containerSizeClasses[size]
                  )}
                >
                  <Icon className={cn(config.className, sizeClasses[size])} />
                </motion.div>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                className="glass-card border-0 px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <Icon className={cn(config.className, "size-4")} />
                  <div>
                    <p className="font-semibold">{config.label}</p>
                    <p className="text-muted-foreground text-xs">
                      {config.description}
                    </p>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          )
        })}
      </div>
    </TooltipProvider>
  )
}

// Inline badge for displaying next to name
export const UserProfileBadgeInline = ({
  badges,
}: {
  badges?: Badge[]
}) => {
  if (!badges || badges.length === 0) return null

  // Only show verified badge inline
  const verifiedBadge = badges.find((b) => b.type === "verified")
  if (!verifiedBadge) return null

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 400 }}
            className="ml-1.5 inline-flex"
          >
            <BadgeCheck className="size-5 fill-blue-500 text-white" />
          </motion.span>
        </TooltipTrigger>
        <TooltipContent side="top" className="glass-card border-0">
          <p className="text-sm font-medium">Compte vérifié</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
