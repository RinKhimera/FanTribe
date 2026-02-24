"use client"

import { Coins, FileText, Heart, Users, Wallet } from "lucide-react"
import { motion } from "motion/react"
import { DashboardStatCard } from "@/components/domains/dashboard/shared/dashboard-stat-card"
import { containerVariants } from "@/lib/animations"

interface KpiCardsProps {
  data: {
    totalRevenueNet: number
    activeSubscribers: number
    totalPosts: number
    totalLikes: number
    tipCount: number
    currency: string
  }
}

const formatAmount = (amount: number) =>
  new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)

export const KpiCards = ({ data }: KpiCardsProps) => {
  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"
    >
      <DashboardStatCard
        title="Revenu total net"
        value={`${formatAmount(data.totalRevenueNet)} XAF`}
        subtitle="Après commission (70%)"
        icon={Wallet}
        colorScheme="blue"
      />
      <DashboardStatCard
        title="Abonnés actifs"
        value={formatAmount(data.activeSubscribers)}
        subtitle="Abonnements en cours"
        icon={Users}
        colorScheme="green"
      />
      <DashboardStatCard
        title="Publications"
        value={formatAmount(data.totalPosts)}
        subtitle="Total de posts"
        icon={FileText}
        colorScheme="purple"
      />
      <DashboardStatCard
        title="J'aime total"
        value={formatAmount(data.totalLikes)}
        subtitle="Sur tous vos posts"
        icon={Heart}
        colorScheme="orange"
      />
      <DashboardStatCard
        title="Pourboires"
        value={formatAmount(data.tipCount)}
        subtitle="Pourboires reçus"
        icon={Coins}
        colorScheme="amber"
      />
    </motion.div>
  )
}
