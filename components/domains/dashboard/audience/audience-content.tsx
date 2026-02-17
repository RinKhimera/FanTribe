"use client"

import { Preloaded, usePreloadedQuery } from "convex/react"
import {
  DollarSign,
  TrendingDown,
  TrendingUp,
  UserMinus,
  UserPlus,
  Users,
} from "lucide-react"
import { motion } from "motion/react"
import { DashboardStatCard } from "@/components/domains/dashboard/shared/dashboard-stat-card"
import { EmptyDashboard } from "@/components/domains/dashboard/shared/empty-dashboard"
import { AtRiskSubscribersList } from "./at-risk-subscribers-list"
import { SubscriberGrowthChart } from "./subscriber-growth-chart"
import { SubscriberList } from "./subscriber-list"
import { TopFansList } from "./top-fans-list"
import { containerVariants } from "@/lib/animations"
import { formatCurrency } from "@/lib/formatters"
import { api } from "@/convex/_generated/api"

type AudienceContentProps = {
  preloadedGrowth: Preloaded<typeof api.dashboard.getSubscriberGrowth>
  preloadedSubscribers: Preloaded<
    typeof api.subscriptions.getMySubscribersStats
  >
  preloadedMetrics: Preloaded<typeof api.dashboard.getAudienceMetrics>
  now: number
}

export const AudienceContent = ({
  preloadedGrowth,
  preloadedSubscribers,
  preloadedMetrics,
  now,
}: AudienceContentProps) => {
  const growth = usePreloadedQuery(preloadedGrowth)
  const subscribersData = usePreloadedQuery(preloadedSubscribers)
  const metrics = usePreloadedQuery(preloadedMetrics)

  const rawSubscribers = subscribersData?.subscribers ?? []
  // Filter out subscribers with missing user data
  const subscribers = rawSubscribers.filter(
    (s) => s.subscriberUser != null,
  )
  const activeCount = subscribers.filter(
    (s) => s.status === "active",
  ).length
  const expiredCount = subscribers.filter(
    (s) => s.status === "expired",
  ).length

  if (subscribers.length === 0) {
    return (
      <div className="p-4">
        <EmptyDashboard
          title="Pas encore d'abonnés"
          description="Partagez du contenu exclusif pour attirer vos premiers abonnés."
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
        Suivez la croissance de votre audience et gérez vos abonnés
      </p>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <DashboardStatCard
          title="Total abonnés"
          value={String(subscribers.length)}
          icon={Users}
          colorScheme="blue"
        />
        <DashboardStatCard
          title="Actifs"
          value={String(activeCount)}
          subtitle="Abonnements en cours"
          icon={UserPlus}
          colorScheme="green"
        />
        <DashboardStatCard
          title="Expirés"
          value={String(expiredCount)}
          subtitle="Abonnements terminés"
          icon={UserMinus}
          colorScheme="orange"
        />
      </div>

      {/* Advanced Metrics Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <DashboardStatCard
          title="ARPU"
          value={formatCurrency(metrics.arpu, "XAF")}
          subtitle="Revenu moyen par abonné"
          icon={DollarSign}
          colorScheme="purple"
        />
        <DashboardStatCard
          title="Rétention"
          value={`${metrics.retentionRate}%`}
          subtitle="Abonnés renouvelés"
          icon={TrendingUp}
          colorScheme="green"
        />
        <DashboardStatCard
          title="Churn"
          value={`${metrics.churnRate}%`}
          subtitle="Pertes ce mois"
          icon={TrendingDown}
          colorScheme="orange"
        />
      </div>

      {/* Growth Chart */}
      <SubscriberGrowthChart data={growth} />

      {/* Top Fans & At-Risk */}
      <div className="grid gap-4 lg:grid-cols-2">
        <TopFansList fans={metrics.topFans} />
        <AtRiskSubscribersList subscribers={metrics.atRiskSubscribers} />
      </div>

      {/* Subscriber List */}
      <SubscriberList subscribers={subscribers} now={now} />
    </motion.div>
  )
}
