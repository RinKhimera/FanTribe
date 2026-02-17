"use client"

import { Preloaded, usePreloadedQuery } from "convex/react"
import { motion } from "motion/react"
import { KpiCards } from "./kpi-cards"
import { MiniRevenueChart } from "./mini-revenue-chart"
import { QuickActions } from "./quick-actions"
import { RecentActivityFeed } from "./recent-activity-feed"
import { containerVariants } from "@/lib/animations"
import { api } from "@/convex/_generated/api"

type OverviewContentProps = {
  preloadedOverview: Preloaded<typeof api.dashboard.getDashboardOverview>
  preloadedTrends: Preloaded<typeof api.dashboard.getRevenueTrends>
}

export const OverviewContent = ({
  preloadedOverview,
  preloadedTrends,
}: OverviewContentProps) => {
  const overview = usePreloadedQuery(preloadedOverview)
  const trends = usePreloadedQuery(preloadedTrends)

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      className="space-y-6 p-4"
    >
      <p className="text-muted-foreground text-sm">
        Aperçu de vos performances et activité récente
      </p>

      {/* KPI Cards */}
      <KpiCards data={overview} />

      {/* Revenue Chart */}
      <MiniRevenueChart data={trends} />

      {/* Bottom section: Activity + Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentActivityFeed activities={overview.recentActivity} />
        </div>
        <div>
          <QuickActions />
        </div>
      </div>
    </motion.div>
  )
}
