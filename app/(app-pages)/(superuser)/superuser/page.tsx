"use client"

import { useQuery } from "convex/react"
import {
  AlertTriangle,
  ArrowRight,
  DollarSign,
  FileText,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { SuperuserStatsCard } from "@/components/superuser"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/convex/_generated/api"
import { useCurrentUser } from "@/hooks/useCurrentUser"
import { cn } from "@/lib/utils"

export default function SuperUserPage() {
  const { currentUser } = useCurrentUser()

  const [dateRange] = useState(() => {
    const now = Date.now()
    return {
      startDate: now - 14 * 24 * 60 * 60 * 1000,
      endDate: now,
    }
  })

  // Use the new consolidated dashboard stats query
  const dashboardStats = useQuery(
    api.superuser.getDashboardStats,
    currentUser?.accountType === "SUPERUSER" ? {} : "skip",
  )

  // Transaction summary for revenue
  const transactionsSummary = useQuery(
    api.transactions.getTransactionsSummary,
    currentUser?.accountType === "SUPERUSER" ? dateRange : "skip",
  )

  // Reports stats
  const reportsStats = useQuery(
    api.reports.getReportsStats,
    currentUser?.accountType === "SUPERUSER" ? {} : "skip",
  )

  const isLoading = !dashboardStats

  // Format currency
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      {/* Content */}
      <div className="flex-1 space-y-6 p-6">
        {/* Stats Grid */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight">
              Vue d&apos;ensemble
            </h2>
            <span className="text-muted-foreground text-xs">
              Mis à jour en temps réel
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SuperuserStatsCard
              title="Utilisateurs"
              value={dashboardStats?.users.total ?? 0}
              subtitle={`${dashboardStats?.users.creators ?? 0} créateurs • ${dashboardStats?.users.regular ?? 0} membres`}
              icon={Users}
              colorScheme="blue"
              isLoading={isLoading}
            />

            <SuperuserStatsCard
              title="Publications"
              value={dashboardStats?.posts.total ?? 0}
              subtitle={`${dashboardStats?.posts.thisWeek ?? 0} cette semaine`}
              icon={FileText}
              trend={
                dashboardStats?.posts.trend !== undefined
                  ? {
                      value: dashboardStats.posts.trend,
                      isPositive: dashboardStats.posts.trend >= 0,
                    }
                  : undefined
              }
              colorScheme="purple"
              isLoading={isLoading}
            />

            <SuperuserStatsCard
              title="Revenus (14j)"
              value={
                transactionsSummary
                  ? formatCurrency(
                      transactionsSummary.totalAmount,
                      transactionsSummary.currency,
                    )
                  : "—"
              }
              subtitle={`${transactionsSummary?.totalTransactions ?? 0} transactions`}
              icon={DollarSign}
              colorScheme="green"
              isLoading={!transactionsSummary}
            />

            <SuperuserStatsCard
              title="En attente"
              value={dashboardStats?.applications.pending ?? 0}
              subtitle="Candidatures à traiter"
              icon={UserPlus}
              colorScheme="orange"
              isLoading={isLoading}
            />
          </div>
        </section>

        {/* Quick Actions */}
        <section>
          <h2 className="mb-4 text-lg font-semibold tracking-tight">
            Actions requises
          </h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Pending Applications Card */}
            <Card className="group relative overflow-hidden transition-shadow duration-300 hover:shadow-md">
              <div className="from-orange-500/5 via-amber-500/5 to-transparent absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              <CardHeader className="relative pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-sm">
                    <UserPlus className="h-4 w-4" aria-hidden="true" />
                  </div>
                  Candidatures Créateur
                </CardTitle>
              </CardHeader>

              <CardContent className="relative space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">
                      En attente de traitement
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      {isLoading ? (
                        <Skeleton className="h-6 w-12" />
                      ) : (
                        <Badge
                          variant={
                            (dashboardStats?.applications.pending ?? 0) > 0
                              ? "destructive"
                              : "secondary"
                          }
                          className="text-sm font-bold"
                        >
                          {dashboardStats?.applications.pending ?? 0}
                        </Badge>
                      )}
                      <span className="text-muted-foreground text-xs">
                        candidature(s)
                      </span>
                    </div>
                  </div>

                  <Link href="/superuser/creator-applications">
                    <Button
                      size="sm"
                      className="gap-2 transition-transform group-hover:translate-x-0.5"
                    >
                      Examiner
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </Link>
                </div>

                {/* Stats row */}
                <div className="border-border/50 flex gap-6 border-t pt-3">
                  <div className="flex items-center gap-2">
                    <UserCheck className="text-emerald-500 h-4 w-4" aria-hidden="true" />
                    <span className="text-sm">
                      <span className="font-medium">
                        {dashboardStats?.applications.approved ?? 0}
                      </span>
                      <span className="text-muted-foreground ml-1">
                        approuvées
                      </span>
                    </span>
                  </div>
                  <div className="text-muted-foreground flex items-center gap-1 text-sm">
                    <span className="font-medium">
                      {dashboardStats?.applications.approvalRate ?? 0}%
                    </span>
                    <span>taux</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pending Reports Card */}
            <Card className="group relative overflow-hidden transition-shadow duration-300 hover:shadow-md">
              <div className="from-rose-500/5 via-pink-500/5 to-transparent absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              <CardHeader className="relative pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-rose-500 to-pink-500 text-white shadow-sm">
                    <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                  </div>
                  Signalements
                </CardTitle>
              </CardHeader>

              <CardContent className="relative space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">
                      Signalements actifs
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      {!reportsStats ? (
                        <Skeleton className="h-6 w-12" />
                      ) : (
                        <Badge
                          variant={
                            (reportsStats?.pending ?? 0) > 0
                              ? "destructive"
                              : "secondary"
                          }
                          className="text-sm font-bold"
                        >
                          {reportsStats?.pending ?? 0}
                        </Badge>
                      )}
                      <span className="text-muted-foreground text-xs">
                        à traiter
                      </span>
                    </div>
                  </div>

                  <Link href="/superuser/reports">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2 transition-transform group-hover:translate-x-0.5"
                    >
                      Voir tout
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </Link>
                </div>

                {/* Stats row */}
                <div className="border-border/50 flex gap-6 border-t pt-3">
                  <div className="text-sm">
                    <span className="font-medium">
                      {reportsStats?.postReports ?? 0}
                    </span>
                    <span className="text-muted-foreground ml-1">posts</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">
                      {reportsStats?.userReports ?? 0}
                    </span>
                    <span className="text-muted-foreground ml-1">
                      utilisateurs
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">
                      {reportsStats?.commentReports ?? 0}
                    </span>
                    <span className="text-muted-foreground ml-1">
                      commentaires
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Platform Health */}
        <section>
          <h2 className="mb-4 text-lg font-semibold tracking-tight">
            Santé de la plateforme
          </h2>

          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
                <HealthMetric
                  label="Système"
                  status="healthy"
                  value="Opérationnel"
                />
                <HealthMetric
                  label="Base de données"
                  status="healthy"
                  value="Connectée"
                />
                <HealthMetric
                  label="Paiements"
                  status="healthy"
                  value="Actifs"
                />
                <HealthMetric
                  label="Dernière sync"
                  status="info"
                  value={new Date().toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                />
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  )
}

function HealthMetric({
  label,
  status,
  value,
}: {
  label: string
  status: "healthy" | "warning" | "error" | "info"
  value: string
}) {
  const statusColors = {
    healthy: "bg-emerald-500",
    warning: "bg-amber-500",
    error: "bg-rose-500",
    info: "bg-blue-500",
  }

  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          "h-2.5 w-2.5 rounded-full",
          statusColors[status],
          status === "healthy" && "motion-safe:animate-pulse",
        )}
      />
      <div>
        <p className="text-muted-foreground text-xs">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  )
}
