"use client"

import { useQuery } from "convex/react"
import { Calendar, DollarSign, TrendingUp, Wallet } from "lucide-react"
import { PageContainer } from "@/components/layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/convex/_generated/api"
import { useCurrentUser } from "@/hooks/useCurrentUser"
import { logger } from "@/lib/config/logger"

const IncomePage = () => {
  const { currentUser, isLoading: isUserLoading } = useCurrentUser()

  const earnings = useQuery(
    api.transactions.getCreatorEarnings,
    currentUser &&
      (currentUser.accountType === "CREATOR" ||
        currentUser.accountType === "SUPERUSER")
      ? undefined
      : "skip",
  )

  // Vérification des permissions
  if (isUserLoading) {
    return (
      <PageContainer title="Revenus">
        <div className="space-y-6 p-4">
          <Skeleton className="h-12 w-64" />
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
          </div>
        </div>
      </PageContainer>
    )
  }

  if (
    !currentUser ||
    (currentUser.accountType !== "CREATOR" &&
      currentUser.accountType !== "SUPERUSER")
  ) {
    logger.warn("Access denied to income page", {
      userId: currentUser?._id,
      accountType: currentUser?.accountType,
    })

    return (
      <PageContainer title="Revenus">
        <div className="flex flex-1 items-center justify-center p-4">
          <div className="max-w-md space-y-4 text-center">
            <div className="border-destructive/50 bg-destructive/10 rounded-lg border p-6">
              <h2 className="text-destructive text-xl font-semibold">
                Accès refusé
              </h2>
              <p className="text-muted-foreground mt-2">
                Cette page est réservée aux créateurs. Devenez créateur pour
                accéder à vos statistiques de revenus.
              </p>
            </div>
          </div>
        </div>
      </PageContainer>
    )
  }

  // Format de la date en français
  const formatDate = (isoDate: string) => {
    const date = new Date(isoDate)
    return new Intl.DateTimeFormat("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date)
  }

  // Format du montant avec séparateurs
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <PageContainer title="Revenus">
      <div className="space-y-6 p-4">
        {/* Description */}
        <p className="text-muted-foreground">
          Consultez vos gains et vos prochains paiements
        </p>

        {earnings ? (
          <>
            {/* Cartes de statistiques */}
            <div className="grid gap-4 md:grid-cols-3">
              {/* Total net gagné */}
              <Card className="border-primary/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total net gagné
                  </CardTitle>
                  <Wallet className="text-muted-foreground size-4" aria-hidden="true" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatAmount(earnings.totalNetEarned)} XAF
                  </div>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {earnings.transactionCount} transaction
                    {earnings.transactionCount > 1 ? "s" : ""} au total
                  </p>
                </CardContent>
              </Card>

              {/* Prochain paiement */}
              <Card className="border-success/20 bg-success/5">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Prochain paiement
                  </CardTitle>
                  <DollarSign className="text-muted-foreground size-4" aria-hidden="true" />
                </CardHeader>
                <CardContent>
                  <div className="text-success text-2xl font-bold">
                    {formatAmount(earnings.nextPaymentNet)} XAF
                  </div>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {earnings.pendingTransactionCount} transaction
                    {earnings.pendingTransactionCount > 1 ? "s" : ""} en attente
                  </p>
                </CardContent>
              </Card>

              {/* Date du prochain paiement */}
              <Card className="border-info/20 bg-info/5">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Date de paiement
                  </CardTitle>
                  <Calendar className="text-muted-foreground size-4" aria-hidden="true" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-semibold capitalize">
                    {formatDate(earnings.nextPaymentDate).split(" ")[0]}
                  </div>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {formatDate(earnings.nextPaymentDate)
                      .split(" ")
                      .slice(1)
                      .join(" ")}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Informations sur la commission */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="size-5" aria-hidden="true" />
                  Comment fonctionnent vos revenus ?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="border-primary/20 rounded-lg border p-4">
                    <h3 className="font-semibold">Votre part</h3>
                    <p className="text-primary text-2xl font-bold">70%</p>
                    <p className="text-muted-foreground text-sm">
                      De chaque abonnement
                    </p>
                  </div>
                  <div className="border-muted rounded-lg border p-4">
                    <h3 className="font-semibold">Commission plateforme</h3>
                    <p className="text-muted-foreground text-2xl font-bold">
                      30%
                    </p>
                    <p className="text-muted-foreground text-sm">
                      Pour l&apos;hébergement et les services
                    </p>
                  </div>
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <h3 className="mb-2 font-semibold">Calendrier de paiement</h3>
                  <ul className="text-muted-foreground space-y-1 text-sm">
                    <li>
                      • Les paiements sont effectués le{" "}
                      <strong>dernier jeudi de chaque mois</strong>
                    </li>
                    <li>
                      • Vous recevez 70% du montant total de vos abonnements du
                      mois
                    </li>
                    <li>• Les paiements sont automatiques et sécurisés</li>
                    <li>
                      • Le prochain paiement inclut toutes les transactions
                      depuis le dernier paiement mensuel
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
          </div>
        )}
      </div>
    </PageContainer>
  )
}

export default IncomePage
