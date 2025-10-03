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
const USE_TEST_DATA = true

export default function TransactionsDashboardPage() {
  const { currentUser, isLoading } = useCurrentUser()

  // État des filtres
  const [dateRange, setDateRange] = useState<{
    startDate: number
    endDate: number
  }>({
    startDate: Date.now() - TWO_WEEKS_MS,
    endDate: Date.now(),
  })
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

  // Vérifier les permissions
  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex h-[50vh] items-center justify-center">
          <div className="border-primary h-12 w-12 animate-spin rounded-full border-b-2"></div>
        </div>
      </div>
    )
  }

  if (!currentUser || currentUser.accountType !== "SUPERUSER") {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Accès refusé</CardTitle>
            <CardDescription>
              Vous n&apos;avez pas les permissions nécessaires pour accéder à
              cette page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="border-muted flex min-h-screen w-full flex-col border-r border-l">
      <div className="container mx-auto space-y-6 p-6">
        {/* En-tête */}
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight">
                  Dashboard des Transactions
                </h1>
                {USE_TEST_DATA && (
                  <Badge variant="secondary" className="text-xs">
                    🧪 Mode Test
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground mt-2">
                Suivi des paiements et performances des créatrices
              </p>
              {USE_TEST_DATA && (
                <p className="text-muted-foreground mt-1 text-xs">
                  Les données affichées sont fictives à des fins de
                  démonstration
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Cartes de résumé */}
        <TransactionsSummaryCards summary={summary} isLoading={!summary} />

        {/* Top et Low Earners */}
        <div className="grid gap-6 md:grid-cols-2">
          <TopEarnersCard
            title="Top Earners"
            description="Les 5 créatrices avec les meilleurs revenus"
            earners={summary?.topEarners || []}
            icon={<TrendingUp className="h-5 w-5 text-green-500" />}
            isLoading={!summary}
          />
          <TopEarnersCard
            title="Low Earners"
            description="Les 5 créatrices avec les revenus les plus faibles"
            earners={summary?.lowEarners || []}
            icon={<TrendingDown className="h-5 w-5 text-orange-500" />}
            isLoading={!summary}
          />
        </div>

        {/* Tableau des transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowDownUp className="h-5 w-5" />
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
              creators={creators || []}
            />

            <TransactionsTable
              transactions={transactions || []}
              isLoading={!transactions}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
