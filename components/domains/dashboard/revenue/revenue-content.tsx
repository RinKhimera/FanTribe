"use client"

import { Preloaded, usePreloadedQuery } from "convex/react"
import { Calendar, Coins, DollarSign, Wallet } from "lucide-react"
import { motion } from "motion/react"
import { DashboardStatCard } from "@/components/domains/dashboard/shared/dashboard-stat-card"
import { RecentTipsList } from "./recent-tips-list"
import { RevenueBreakdown } from "./revenue-breakdown"
import { RevenueTrendsChart } from "./revenue-trends-chart"
import { CommissionInfo } from "./commission-info"
import { containerVariants } from "@/lib/animations"
import { api } from "@/convex/_generated/api"

type RevenueContentProps = {
  preloadedEarnings: Preloaded<typeof api.transactions.getCreatorEarnings>
  preloadedTips: Preloaded<typeof api.tips.getCreatorTipEarnings>
  preloadedTrends: Preloaded<typeof api.dashboard.getRevenueTrends>
}

const formatDate = (isoDate: string) => {
  const date = new Date(isoDate)
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date)
}

const formatAmount = (amount: number) =>
  new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)

export const RevenueContent = ({
  preloadedEarnings,
  preloadedTips,
  preloadedTrends,
}: RevenueContentProps) => {
  const earnings = usePreloadedQuery(preloadedEarnings)
  const tipEarnings = usePreloadedQuery(preloadedTips)
  const trends = usePreloadedQuery(preloadedTrends)

  const dateFormatted = formatDate(earnings.nextPaymentDate)
  const dateParts = dateFormatted.split(" ")

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      className="space-y-6 p-4"
    >
      <p className="text-muted-foreground text-sm">
        Consultez vos gains et vos prochains paiements
      </p>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardStatCard
          title="Total net gagné"
          value={`${formatAmount(earnings.totalNetEarned)} XAF`}
          subtitle={`${earnings.transactionCount} transaction${earnings.transactionCount > 1 ? "s" : ""} au total`}
          icon={Wallet}
          colorScheme="blue"
        />
        <DashboardStatCard
          title="Prochain paiement"
          value={`${formatAmount(earnings.nextPaymentNet)} XAF`}
          subtitle={`${earnings.pendingTransactionCount} transaction${earnings.pendingTransactionCount > 1 ? "s" : ""} en attente`}
          icon={DollarSign}
          colorScheme="green"
        />
        <DashboardStatCard
          title="Date de paiement"
          value={dateParts[0] ?? ""}
          subtitle={dateParts.slice(1).join(" ")}
          icon={Calendar}
          colorScheme="purple"
        />
        {tipEarnings.tipCount > 0 && (
          <DashboardStatCard
            title="Pourboires reçus"
            value={`${formatAmount(tipEarnings.totalTipsNet)} XAF`}
            subtitle={`${tipEarnings.tipCount} pourboire${tipEarnings.tipCount > 1 ? "s" : ""} (net)`}
            icon={Coins}
            colorScheme="amber"
          />
        )}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueTrendsChart data={trends} />
        </div>
        <div>
          <RevenueBreakdown
            subscriptionRevenue={
              earnings.totalNetEarned - earnings.totalTipsNet
            }
            tipRevenue={earnings.totalTipsNet}
          />
        </div>
      </div>

      {/* Recent Tips */}
      {tipEarnings.recentTips.length > 0 && (
        <RecentTipsList tips={tipEarnings.recentTips} />
      )}

      {/* Commission Info */}
      <CommissionInfo />
    </motion.div>
  )
}
