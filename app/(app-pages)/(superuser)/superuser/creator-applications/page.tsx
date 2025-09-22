"use client"

import { useQuery } from "convex/react"
import { AlertTriangle, Calendar, Eye, User } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { api } from "@/convex/_generated/api"
import { useCurrentUser } from "@/hooks/useCurrentUser"
import { Application } from "@/types"
import { detectRiskFactors, getRiskBadge } from "@/utils/detectRiskFactors"
import { getStatusBadge } from "@/utils/getStatusBadge"

const CreatorApplicationsPage = () => {
  const { currentUser } = useCurrentUser()

  // Query pour toutes les candidatures
  const allApplications = useQuery(
    api.creatorApplications.getAllApplications,
    currentUser?.accountType === "SUPERUSER" ? {} : "skip",
  )

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const renderApplicationCard = (application: Application) => {
    const riskFactors = allApplications
      ? detectRiskFactors(application, allApplications)
      : []
    const hasRisk = riskFactors.length > 0

    return (
      <Card
        key={application._id}
        className={`transition-shadow hover:shadow-md ${
          hasRisk && application.status === "pending"
            ? "border-orange-500/50 bg-orange-950/20"
            : ""
        }`}
      >
        <CardHeader className="@container">
          <div className="@md:flex @md:items-center @md:justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-muted flex h-10 w-10 items-center justify-center overflow-hidden rounded-full">
                {application.user?.image ? (
                  <Image
                    src={application.user.image}
                    alt={application.user.name}
                    width={40}
                    height={40}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <User className="h-5 w-5" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className="truncate text-lg">
                  {application.personalInfo.fullName}
                </CardTitle>
                <CardDescription>
                  @{application.user?.username || "N/A"} •{" "}
                  <span className="hidden sm:inline">
                    {application.user?.email}
                  </span>
                  <span className="sm:hidden">
                    {application.user?.email?.split("@")[0]}...
                  </span>
                </CardDescription>
              </div>
            </div>

            {/* Bouton - Positionné différemment selon la taille du conteneur */}
            <div className="@md:ml-4 @md:shrink-0">
              <Link href={`/superuser/creator-applications/${application._id}`}>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 w-full @md:mt-0 @md:w-auto"
                >
                  <Eye className="mr-1 h-4 w-4" />
                  <span className="hidden sm:inline">
                    {application.status === "pending" ? "Examiner" : "Voir"}
                  </span>
                  <span className="sm:hidden">
                    {application.status === "pending" ? "Examiner" : "Voir"}
                  </span>
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Badges déplacés ici - plus d'espace */}
            <div className="flex flex-wrap items-center gap-2">
              {getStatusBadge(application.status)}
              {hasRisk &&
                application.status === "pending" &&
                getRiskBadge(riskFactors)}
            </div>

            {/* Informations de base */}
            <div className="text-muted-foreground flex flex-col space-y-2 text-sm sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
              <div className="flex flex-col space-y-1 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
                <span className="flex items-center">
                  <Calendar className="mr-1 h-4 w-4" />
                  {formatDate(application.submittedAt)}
                </span>
                <span>{application.identityDocuments.length} document(s)</span>
              </div>
              <span className="text-xs sm:text-sm">
                Né(e) le {application.personalInfo.dateOfBirth}
              </span>
            </div>

            {/* Motivation */}
            <div>
              <p className="line-clamp-2 text-sm sm:line-clamp-3">
                {application.applicationReason}
              </p>
            </div>

            {/* Informations supplémentaires */}
            <div className="space-y-1">
              {application.reviewedAt && (
                <div className="text-muted-foreground text-xs">
                  Traitée le {formatDate(application.reviewedAt)}
                </div>
              )}
              {hasRisk && application.status === "pending" && (
                <div>
                  <p className="text-xs font-medium text-orange-400">
                    {riskFactors.length} facteur(s) de risque détecté(s)
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderEmptyState = (title: string, description: string) => (
    <Card className="p-8 text-center">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
    </Card>
  )

  if (!allApplications) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-lg">Chargement...</div>
      </div>
    )
  }

  const pendingApplications = allApplications.filter(
    (app) => app.status === "pending",
  )
  const processedApplications = allApplications.filter(
    (app) => app.status !== "pending",
  )

  // Compter les candidatures à risque dans les pending
  const riskyPendingCount = pendingApplications.filter(
    (app) => detectRiskFactors(app, allApplications).length > 0,
  ).length

  return (
    <main className="border-muted flex h-full min-h-screen w-full flex-col border-r border-l sm:w-[80%] lg:w-[60%]">
      <div className="border-muted bg-background/95 sticky top-0 z-20 border-b p-4 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Candidatures Créateur</h1>
          <div className="flex items-center space-x-2">
            <Badge
              variant="secondary"
              className="border-slate-500 bg-slate-600 text-slate-100"
            >
              {allApplications.length} total
            </Badge>
            {riskyPendingCount > 0 && (
              <Badge
                variant="destructive"
                className="border-red-500 bg-red-600 text-red-100"
              >
                {riskyPendingCount} à risque
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 p-3">
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pending" className="relative">
              En attente
              {pendingApplications.length > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center border-red-500 bg-red-600 p-0 text-xs text-red-100"
                >
                  {pendingApplications.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="processed">
              Traitées ({processedApplications.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-6">
            {pendingApplications.length === 0 ? (
              renderEmptyState(
                "Aucune candidature en attente",
                "Toutes les candidatures ont été traitées.",
              )
            ) : (
              <>
                {riskyPendingCount > 0 && (
                  <Alert className="mb-4 border-orange-500 bg-orange-950/50 text-orange-100">
                    <AlertTriangle className="h-4 w-4 text-orange-400" />
                    <AlertTitle className="text-orange-200">
                      Candidatures à risque détectées
                    </AlertTitle>
                    <AlertDescription className="text-orange-300">
                      {riskyPendingCount} candidature(s) présente(nt) des
                      facteurs de risque et nécessite(nt) une attention
                      particulière.
                    </AlertDescription>
                  </Alert>
                )}
                <div className="space-y-4">
                  {pendingApplications.map((application) =>
                    renderApplicationCard(application),
                  )}
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="processed" className="mt-6">
            {processedApplications.length === 0 ? (
              renderEmptyState(
                "Aucune candidature traitée",
                "Aucune candidature n'a encore été traitée.",
              )
            ) : (
              <div className="space-y-4">
                {processedApplications.map((application) =>
                  renderApplicationCard(application),
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}

export default CreatorApplicationsPage
