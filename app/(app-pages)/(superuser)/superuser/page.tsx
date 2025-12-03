"use client"

import { useQuery } from "convex/react"
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Clock,
  DollarSign,
  Eye,
  FileText,
  MessageSquare,
  Shield,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { api } from "@/convex/_generated/api"
import { useCurrentUser } from "@/hooks/useCurrentUser"

const SuperUserPage = () => {
  const { currentUser } = useCurrentUser()

  const [dateRange] = useState(() => {
    const now = Date.now()
    return {
      startDate: now - 14 * 24 * 60 * 60 * 1000,
      endDate: now,
    }
  })

  const [weekAgo] = useState(() => Date.now() - 7 * 24 * 60 * 60 * 1000)

  // Queries pour récupérer les statistiques
  const allApplications = useQuery(
    api.creatorApplications.getAllApplications,
    currentUser?.accountType === "SUPERUSER" ? {} : "skip",
  )

  const allPosts = useQuery(
    api.posts.getAllPosts,
    currentUser?.accountType === "SUPERUSER" ? {} : "skip",
  )

  const allUsers = useQuery(
    api.users.getUsers,
    currentUser?.accountType === "SUPERUSER" ? {} : "skip",
  )

  const reportsStats = useQuery(
    api.reports.getReportsStats,
    currentUser?.accountType === "SUPERUSER" ? {} : "skip",
  )

  // Récupérer les statistiques des transactions (2 dernières semaines)
  const transactionsSummary = useQuery(
    api.transactions.getTransactionsSummary,
    currentUser?.accountType === "SUPERUSER" ? dateRange : "skip",
  )

  // Calcul des statistiques
  const pendingApplications =
    allApplications?.filter((app) => app.status === "pending") || []
  const approvedApplications =
    allApplications?.filter((app) => app.status === "approved") || []
  const rejectedApplications =
    allApplications?.filter((app) => app.status === "rejected") || []

  const totalUsers = allUsers?.length || 0
  const totalPosts = allPosts?.length || 0
  const totalApplications = allApplications?.length || 0

  const creatorUsers =
    allUsers?.filter((user) => user.accountType === "CREATOR") || []
  const regularUsers =
    allUsers?.filter((user) => user.accountType === "USER") || []

  // Posts récents (7 derniers jours)
  const recentPosts =
    allPosts?.filter((post) => {
      return post._creationTime > weekAgo
    }) || []

  const isLoading = !allApplications || !allPosts || !allUsers

  return (
    <main className="border-muted flex h-full min-h-screen w-full flex-col border-r border-l max-[500px]:pb-16">
      <div className="border-muted bg-background/95 sticky top-0 z-20 border-b p-4 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Dashboard Administrateur</h1>
          <Badge variant="outline" className="hidden sm:inline-flex">
            <Shield className="mr-1 h-3 w-3" />
            SuperUser
          </Badge>
        </div>
      </div>

      <div className="flex-1 space-y-6 p-4">
        {/* Statistiques principales */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="flex-1 text-sm font-medium">
                Utilisateurs Total
              </CardTitle>
              <Users className="text-muted-foreground ml-2 h-6 w-6 shrink-0" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? "..." : totalUsers}
              </div>
              <p className="text-muted-foreground text-xs">
                {creatorUsers.length} créateurs • {regularUsers.length}{" "}
                utilisateurs
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="flex-1 text-sm font-medium">
                Posts Publiés
              </CardTitle>
              <FileText className="text-muted-foreground ml-2 h-6 w-6 shrink-0" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? "..." : totalPosts}
              </div>
              <p className="text-muted-foreground text-xs">
                {recentPosts.length} cette semaine
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="flex-1 text-sm font-medium">
                Candidatures
              </CardTitle>
              <UserPlus className="text-muted-foreground ml-2 h-6 w-6 shrink-0" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? "..." : totalApplications}
              </div>
              <p className="text-muted-foreground text-xs">
                {pendingApplications.length} en attente
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="flex-1 text-sm font-medium">
                Revenus (2 semaines)
              </CardTitle>
              <DollarSign className="text-muted-foreground ml-2 h-6 w-6 shrink-0" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {!transactionsSummary
                  ? "..."
                  : new Intl.NumberFormat("fr-FR", {
                      style: "currency",
                      currency: transactionsSummary.currency,
                      minimumFractionDigits: 0,
                    }).format(transactionsSummary.totalAmount)}
              </div>
              <p className="text-muted-foreground text-xs">
                {transactionsSummary?.totalTransactions || 0} transactions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="flex-1 text-sm font-medium">
                Taux d&apos;Approbation
              </CardTitle>
              <TrendingUp className="text-muted-foreground ml-2 h-6 w-6 shrink-0" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading
                  ? "..."
                  : totalApplications > 0
                    ? `${Math.round((approvedApplications.length / totalApplications) * 100)}%`
                    : "0%"}
              </div>
              <p className="text-muted-foreground text-xs">
                {approvedApplications.length} approuvées
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Actions rapides */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Candidatures Créateur
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    En attente de traitement
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive" className="text-xs">
                      {pendingApplications.length}
                    </Badge>
                    <span className="text-muted-foreground text-xs">
                      candidatures
                    </span>
                  </div>
                </div>
                <Link href="/superuser/creator-applications">
                  <Button variant="outline" size="sm">
                    <Eye className="mr-2 h-4 w-4" />
                    Examiner
                  </Button>
                </Link>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Approuvées</span>
                  <span className="font-medium text-green-600">
                    {approvedApplications.length}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Rejetées</span>
                  <span className="font-medium text-red-600">
                    {rejectedApplications.length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Signalements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Signalements actifs</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {reportsStats?.pending || 0}
                    </Badge>
                    <span className="text-muted-foreground text-xs">
                      à traiter
                    </span>
                  </div>
                </div>
                <Link href="/superuser/reports">
                  <Button variant="outline" size="sm">
                    <Eye className="mr-2 h-4 w-4" />
                    Voir tout
                  </Button>
                </Link>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Posts signalés</span>
                  <span className="font-medium">
                    {reportsStats?.postReports || 0}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Utilisateurs signalés</span>
                  <span className="font-medium">
                    {reportsStats?.userReports || 0}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Statistiques détaillées */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Aperçu de l&apos;activité
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Activité récente</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Posts cette semaine</span>
                    <span className="font-medium">{recentPosts.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Nouveaux utilisateurs</span>
                    <span className="font-medium">-</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Contenu</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Posts publics</span>
                    <span className="font-medium">
                      {allPosts?.filter(
                        (p) => !p.visibility || p.visibility === "public",
                      ).length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Posts privés</span>
                    <span className="font-medium">
                      {allPosts?.filter(
                        (p) => p.visibility === "subscribers_only",
                      ).length || 0}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium">Statut</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Système</span>
                    <Badge variant="secondary" className="text-xs">
                      Actif
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Dernière MAJ</span>
                    <span className="text-xs font-medium">
                      {new Date().toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions d'administration */}
        <Card>
          <CardHeader>
            <CardTitle>Actions d&apos;administration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Link href="/superuser/creator-applications">
                <Button
                  variant="outline"
                  className="flex h-auto w-full flex-col items-center gap-2 p-4"
                >
                  <UserPlus className="h-6 w-6" />
                  <span className="font-medium">Candidatures</span>
                  <span className="text-muted-foreground text-xs">
                    Gérer les demandes créateur
                  </span>
                </Button>
              </Link>

              <Link href="/superuser/reports">
                <Button
                  variant="outline"
                  className="flex h-auto w-full flex-col items-center gap-2 p-4"
                >
                  <AlertTriangle className="h-6 w-6" />
                  <span className="font-medium">Signalements</span>
                  <span className="text-muted-foreground text-xs">
                    Modérer le contenu
                  </span>
                </Button>
              </Link>

              <Link href="/superuser/transactions">
                <Button
                  variant="outline"
                  className="flex h-auto w-full flex-col items-center gap-2 p-4"
                >
                  <BarChart3 className="h-6 w-6" />
                  <span className="font-medium">Transactions</span>
                  <span className="text-muted-foreground text-xs">
                    Suivi des paiements
                  </span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

export default SuperUserPage
