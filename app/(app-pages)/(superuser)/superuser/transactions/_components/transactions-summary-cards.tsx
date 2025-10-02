"use client"

import { DollarSign, Receipt, TrendingUp, Users } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount)
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-muted rounded"></div>
              <div className="h-4 w-4 bg-muted rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 w-32 bg-muted rounded"></div>
              <div className="h-3 w-20 bg-muted rounded mt-2"></div>
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
    summary.totalTransactions > 0 ? summary.totalAmount / summary.totalTransactions : 0

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Total global */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Revenu Total</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(summary.totalAmount, summary.currency)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Pour la période sélectionnée
          </p>
        </CardContent>
      </Card>

      {/* Nombre de transactions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Transactions</CardTitle>
          <Receipt className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.totalTransactions}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Paiements réussis
          </p>
        </CardContent>
      </Card>

      {/* Nombre de créatrices */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Créatrices actives</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.creatorSummaries.length}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Ont reçu des paiements
          </p>
        </CardContent>
      </Card>

      {/* Moyenne par transaction */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Moyenne/Transaction</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(averagePerTransaction, summary.currency)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Montant moyen
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
