"use client"

import { useQuery } from "convex/react"
import { motion } from "motion/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { pluralize } from "@/lib/formatters"

interface UserProfileStatsProps {
  userId: Id<"users">
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M"
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, "") + "k"
  }
  return num.toString()
}

export const UserProfileStats = ({ userId }: UserProfileStatsProps) => {
  const stats = useQuery(api.userStats.getUserProfileStats, { userId })

  if (!stats) {
    return (
      <div className="text-muted-foreground flex items-center gap-1 text-sm">
        <span className="bg-muted h-4 w-20 animate-pulse rounded" />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="text-muted-foreground flex flex-wrap items-center gap-x-1 gap-y-0.5 text-sm"
    >
      {stats.kind === "creator" ? (
        <>
          <span>
            <span className="text-foreground font-semibold tabular-nums">
              {formatNumber(stats.postsCount)}
            </span>{" "}
            {pluralize(stats.postsCount, "publication")}
          </span>
          <span className="text-muted-foreground/50">·</span>
          <span>
            <span className="text-foreground font-semibold tabular-nums">
              {formatNumber(stats.followersCount)}
            </span>{" "}
            {pluralize(stats.followersCount, "follower")}
          </span>
          <span className="text-muted-foreground/50">·</span>
          <span>
            <span className="text-foreground font-semibold tabular-nums">
              {formatNumber(stats.totalLikes)}
            </span>{" "}
            j&apos;aime
          </span>
        </>
      ) : (
        <>
          <span>
            <span className="text-foreground font-semibold tabular-nums">
              {formatNumber(stats.subscriptionsCount)}
            </span>{" "}
            {pluralize(stats.subscriptionsCount, "abonnement")}
          </span>
          <span className="text-muted-foreground/50">·</span>
          <span>
            <span className="text-foreground font-semibold tabular-nums">
              {formatNumber(stats.likesGivenCount)}
            </span>{" "}
            j&apos;aime
          </span>
        </>
      )}
    </motion.div>
  )
}
