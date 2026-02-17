"use client"

import { Preloaded, usePreloadedQuery } from "convex/react"
import { Heart, MessageSquareText, Zap } from "lucide-react"
import { motion } from "motion/react"
import { DashboardStatCard } from "@/components/domains/dashboard/shared/dashboard-stat-card"
import { EmptyDashboard } from "@/components/domains/dashboard/shared/empty-dashboard"
import { TopPostsList } from "./top-posts-list"
import { VisibilityComparison } from "./visibility-comparison"
import { containerVariants } from "@/lib/animations"
import { api } from "@/convex/_generated/api"

type ContentPerformanceProps = {
  preloadedTopPosts: Preloaded<typeof api.dashboard.getTopPosts>
  preloadedEngagement: Preloaded<typeof api.dashboard.getEngagementStats>
}

export const ContentPerformance = ({
  preloadedTopPosts,
  preloadedEngagement,
}: ContentPerformanceProps) => {
  const topPosts = usePreloadedQuery(preloadedTopPosts)
  const engagement = usePreloadedQuery(preloadedEngagement)

  if (engagement.totalEngagements === 0 && topPosts.posts.length === 0) {
    return (
      <div className="p-4">
        <EmptyDashboard
          title="Pas encore de contenu"
          description="Publiez vos premiers posts pour voir les statistiques d'engagement apparaître ici."
        />
      </div>
    )
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      className="space-y-6 p-4"
    >
      <p className="text-muted-foreground text-sm">
        Performance de vos publications et engagement de votre audience
      </p>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <DashboardStatCard
          title="Moy. j'aime / post"
          value={String(engagement.avgLikesPerPost)}
          icon={Heart}
          colorScheme="orange"
        />
        <DashboardStatCard
          title="Moy. commentaires / post"
          value={String(engagement.avgCommentsPerPost)}
          icon={MessageSquareText}
          colorScheme="blue"
        />
        <DashboardStatCard
          title="Engagements total"
          value={String(engagement.totalEngagements)}
          subtitle="J'aime + commentaires"
          icon={Zap}
          colorScheme="purple"
        />
      </div>

      {/* Content section */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TopPostsList posts={topPosts.posts} />
        </div>
        <div>
          <VisibilityComparison
            publicPerformance={engagement.publicPerformance}
            subscribersOnlyPerformance={
              engagement.subscribersOnlyPerformance
            }
          />
        </div>
      </div>
    </motion.div>
  )
}
