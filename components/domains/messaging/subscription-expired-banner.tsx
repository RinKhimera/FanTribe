"use client"

import { motion } from "motion/react"
import { AlertCircle, ChevronRight, Clock } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

type SubscriptionExpiredBannerProps = {
  variant?: "warning" | "expired"
  creatorName?: string
  expiresAt?: number
  className?: string
}

export const SubscriptionExpiredBanner = ({
  variant = "expired",
  creatorName,
  expiresAt,
  className,
}: SubscriptionExpiredBannerProps) => {
  const isWarning = variant === "warning"

  // Helper function to calculate time remaining
  const calculateTimeRemaining = (expiry: number | undefined): string | null => {
    if (!expiry) return null
    const now = Date.now()
    const diff = expiry - now
    if (diff <= 0) return null

    const hours = Math.floor(diff / (1000 * 60 * 60))
    if (hours > 24) {
      const days = Math.floor(hours / 24)
      return `${days} jour${days > 1 ? "s" : ""}`
    }
    return `${hours} heure${hours > 1 ? "s" : ""}`
  }

  const [timeRemaining, setTimeRemaining] = useState<string | null>(() =>
    calculateTimeRemaining(expiresAt)
  )

  // Update time remaining periodically
  useEffect(() => {
    // Update every minute
    const interval = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining(expiresAt))
    }, 60000)
    return () => clearInterval(interval)
  }, [expiresAt])

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className={cn(
        "overflow-hidden",
        className
      )}
    >
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-3 text-sm",
          isWarning
            ? "bg-amber-500/10 border-b border-amber-500/20"
            : "bg-destructive/10 border-b border-destructive/20"
        )}
      >
        <div
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-full",
            isWarning ? "bg-amber-500/20" : "bg-destructive/20"
          )}
        >
          {isWarning ? (
            <Clock size={16} className="text-amber-500" />
          ) : (
            <AlertCircle size={16} className="text-destructive" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "font-medium",
              isWarning ? "text-amber-500" : "text-destructive"
            )}
          >
            {isWarning
              ? "Abonnement bientôt expiré"
              : "Abonnement messagerie expiré"}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {isWarning && timeRemaining
              ? `Expire dans ${timeRemaining}${creatorName ? ` - ${creatorName}` : ""}`
              : creatorName
                ? `Renouvelez pour discuter avec ${creatorName}`
                : "Renouvelez pour continuer à discuter"}
          </p>
        </div>

        <Link
          href="/settings/subscriptions"
          className={cn(
            "flex items-center gap-1 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
            isWarning
              ? "bg-amber-500/20 text-amber-500 hover:bg-amber-500/30"
              : "bg-destructive/20 text-destructive hover:bg-destructive/30"
          )}
        >
          Renouveler
          <ChevronRight size={14} />
        </Link>
      </div>
    </motion.div>
  )
}

// Compact version pour la liste des conversations
type CompactExpiredBadgeProps = {
  className?: string
}

export const CompactExpiredBadge = ({ className }: CompactExpiredBadgeProps) => {
  return (
    <motion.span
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-destructive/20 px-2 py-0.5 text-xs text-destructive",
        className
      )}
    >
      <AlertCircle size={10} />
      Expiré
    </motion.span>
  )
}
