"use client"

import { useQuery } from "convex/react"
import { ArrowDownUp, TrendingDown, TrendingUp } from "lucide-react"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { useCurrentUser } from "@/hooks/useCurrentUser"
import { TopEarnersCard } from "./_components/top-earners-card"
import { TransactionsFilters } from "./_components/transactions-filters"
import { TransactionsSummaryCards } from "./_components/transactions-summary-cards"
import { TransactionsTable } from "./_components/transactions-table"

// Période par défaut : 2 semaines (14 jours)
const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000

// 🧪 Mode TEST - Mettre à true pour afficher des données fictives
const USE_TEST_DATA = false

export default function TransactionsDashboardPage() {
  const { currentUser, isLoading } = useCurrentUser()

  const [dateRange, setDateRange] = useState<{
    startDate: number
    endDate: number
  }>(() => ({
    startDate: Date.now() - TWO_WEEKS_MS,
    endDate: Date.now(),
  }))
  const [selectedCreatorId, setSelectedCreatorId] = useState<
    Id<"users"> | undefined
  >()
  const [selectedProvider, setSelectedProvider] = useState<string | undefined>()

  // Choisir entre données réelles et données de test
  const transactionsQuery = USE_TEST_DATA
    ? api.transactions.getTestTransactionsForDashboard
    : api.transactions.getTransactionsForDashboard

  const summaryQuery = USE_TEST_DATA
    ? api.transactions.getTestTransactionsSummary
    : api.transactions.getTransactionsSummary

  const creatorsQuery = USE_TEST_DATA
    ? api.transactions.getTestCreators
    : api.transactions.getAllCreators

  // Récupérer les transactions filtrées
  const transactions = useQuery(
    transactionsQuery,
    currentUser?.accountType === "SUPERUSER"
      ? {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          creatorId: selectedCreatorId,
          provider: selectedProvider,
        }
      : "skip",
  )

  // Récupérer les statistiques agrégées
  const summary = useQuery(
    summaryQuery,
    currentUser?.accountType === "SUPERUSER"
      ? {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          creatorId: selectedCreatorId,
          provider: selectedProvider,
        }
      : "skip",
  )

  // Récupérer tous les créateurs pour le filtre
  const creators = useQuery(
    creatorsQuery,
    currentUser?.accountType === "SUPERUSER" ? {} : "skip",
  )

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-full flex-col overflow-y-auto">
        <div className="flex-1 space-y-4 p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-64 rounded-lg" />
            <Skeleton className="h-64 rounded-lg" />
          </div>
          <Skeleton className="h-96 rounded-lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="flex-1 space-y-4 p-4">
        {/* Header with test mode badge */}
        {USE_TEST_DATA && (
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="gap-1.5">
              <span className="text-base">🧪</span>
              Mode Test - Données fictives
            </Badge>
          </div>
        )}

        {/* Cartes de résumé */}
        <TransactionsSummaryCards summary={summary} isLoading={!summary} />

        {/* Top et Low Earners */}
        <div className="grid gap-4 md:grid-cols-2">
          <TopEarnersCard
            title="Top Earners"
            description="Les 5 créatrices avec les meilleurs revenus"
            earners={summary?.topEarners || []}
            icon={<TrendingUp className="h-5 w-5 text-emerald-500" />}
            isLoading={!summary}
          />
          <TopEarnersCard
            title="Low Earners"
            description="Les 5 créatrices avec les revenus les plus faibles"
            earners={summary?.lowEarners || []}
            icon={<TrendingDown className="h-5 w-5 text-amber-500" />}
            isLoading={!summary}
          />
        </div>

        {/* Tableau des transactions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ArrowDownUp className="h-4 w-4" />
              Transactions détaillées
            </CardTitle>
            <CardDescription>
              Liste complète des transactions pour la période sélectionnée
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filtres */}
            <TransactionsFilters
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              selectedCreatorId={selectedCreatorId}
              onCreatorChange={setSelectedCreatorId}
              selectedProvider={selectedProvider}
              onProviderChange={setSelectedProvider}
              creators={
                (creators || []) as Array<{
                  _id: Id<"users">
                  name: string
                  username?: string
                  image: string
                }>
              }
            />

            <TransactionsTable
              transactions={
                (transactions || []) as Array<{
                  _id: Id<"transactions">
                  _creationTime: number
                  amount: number
                  currency: string
                  provider: string
                  providerTransactionId: string
                  creator: {
                    _id: Id<"users">
                    name: string
                    username?: string
                    image: string
                  } | null
                  subscriber: {
                    _id: Id<"users">
                    name: string
                    username?: string
                    image: string
                  } | null
                }>
              }
              isLoading={!transactions}
            />
          </CardContent>
        </Card>

        {/* Results count */}
        {transactions && transactions.length > 0 && (
          <p className="text-muted-foreground text-center text-xs">
            {transactions.length} transaction(s) affichée(s)
          </p>
        )}
      </div>
    </div>
  )
}
