"use client"

import { RotateCcw } from "lucide-react"
import { motion } from "motion/react"
import { FollowButton } from "@/components/domains/users/follow-button"
import { SuggestionCard } from "@/components/shared/suggestions/suggestion-card"
import { cn } from "@/lib/utils"
import type { UserProps } from "@/types"

interface ExploreSuggestionsProps {
  creators: NonNullable<UserProps>[]
  isLoading: boolean
  onRefresh: () => void
}

const containerVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.05,
    },
  },
}

const itemVariants = {
  initial: { opacity: 0, y: 12, scale: 0.98 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.35,
      ease: [0.25, 0.1, 0.25, 1] as const,
    },
  },
}

const SkeletonCard = () => (
  <div className="bg-muted/20 h-[100px] w-[190px] shrink-0 animate-pulse rounded-xl" />
)

export const ExploreSuggestions = ({
  creators,
  isLoading,
  onRefresh,
}: ExploreSuggestionsProps) => {
  // Masquer si aucun créateur et pas en chargement
  if (!isLoading && creators.length === 0) return null

  return (
    <div className="border-border/40 border-b pb-4">
      {/* Section header */}
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="text-muted-foreground text-sm font-semibold tracking-wider uppercase">
          Créateurs à découvrir
        </h2>
        <motion.button
          onClick={onRefresh}
          whileHover={{ rotate: -180 }}
          whileTap={{ scale: 0.9 }}
          transition={{ duration: 0.4 }}
          className={cn(
            "glass-button flex size-8 items-center justify-center rounded-full",
            "text-muted-foreground hover:text-foreground",
          )}
          aria-label="Rafraîchir les suggestions"
        >
          <RotateCcw className="size-3.5" />
        </motion.button>
      </div>

      {/* Horizontal scroll strip */}
      <div
        className="scrollbar-none flex gap-3 overflow-x-auto px-4 pb-2"
        style={{
          maskImage:
            "linear-gradient(to right, transparent, black 16px, black calc(100% - 16px), transparent)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent, black 16px, black calc(100% - 16px), transparent)",
        }}
      >
        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <motion.div
            className="flex gap-3"
            variants={containerVariants}
            initial="initial"
            animate="animate"
          >
            {creators.slice(0, 12).map((creator) => (
              <motion.div
                key={creator._id}
                variants={itemVariants}
                className="relative w-[180px] shrink-0"
              >
                <SuggestionCard user={creator} variant="compact" />
                <div className="absolute right-2 bottom-2 z-10">
                  <FollowButton targetUserId={creator._id} variant="icon" />
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  )
}
