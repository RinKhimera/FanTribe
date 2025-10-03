"use client"

import { DollarSign, Receipt, TrendingUp, Users } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { type Currency, formatDualCurrency } from "@/lib/services/currency"

interface TransactionsSummaryCardsProps {
  summary?: {
    totalAmount: number
    totalTransactions: number
    currency: string
    creatorSummaries: Array<{
      creatorId: string
      creatorName: string
      totalAmount: number
      transactionCount: number
    }>
  }
  isLoading: boolean
}

export function TransactionsSummaryCards({
  summary,
  isLoading,
}: TransactionsSummaryCardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="bg-muted h-4 w-24 rounded"></div>
              <div className="bg-muted h-4 w-4 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="bg-muted h-8 w-32 rounded"></div>
              <div className="bg-muted mt-2 h-3 w-20 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!summary) {
    return null
  }

  const averagePerTransaction =
    summary.totalTransactions > 0
      ? summary.totalAmount / summary.totalTransactions
      : 0

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Total global */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Revenu Total</CardTitle>
          <DollarSign className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatDualCurrency(
              summary.totalAmount,
              summary.currency.toUpperCase() as Currency,
              true,
            )}
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            Pour la période sélectionnée
          </p>
        </CardContent>
      </Card>

      {/* Nombre de transactions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Transactions</CardTitle>
          <Receipt className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.totalTransactions}</div>
          <p className="text-muted-foreground mt-1 text-xs">
            Paiements réussis
          </p>
        </CardContent>
      </Card>

      {/* Nombre de créatrices */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Créatrices actives
          </CardTitle>
          <Users className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {summary.creatorSummaries.length}
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            Ont reçu des paiements
          </p>
        </CardContent>
      </Card>

      {/* Moyenne par transaction */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Moyenne/Transaction
          </CardTitle>
          <TrendingUp className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatDualCurrency(
              averagePerTransaction,
              summary.currency.toUpperCase() as Currency,
              true,
            )}
          </div>
          <p className="text-muted-foreground mt-1 text-xs">Montant moyen</p>
        </CardContent>
      </Card>
    </div>
  )
}
