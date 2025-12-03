"use client"

import { useMutation, useQuery } from "convex/react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import {
  AlertTriangle,
  Calendar,
  Check,
  Edit,
  Eye,
  MessageSquare,
  User,
  X,
} from "lucide-react"
import Link from "next/link"
import { useState, useTransition } from "react"
import { toast } from "sonner"
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { useCurrentUser } from "@/hooks/useCurrentUser"
import { Report } from "@/types"

const ReportsPage = () => {
  const { currentUser } = useCurrentUser()
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [adminNotes, setAdminNotes] = useState("")
  const [isPending, startTransition] = useTransition()

  // Queries
  const allReports = useQuery(
    api.reports.getAllReports,
    currentUser?.accountType === "SUPERUSER" ? {} : "skip",
  )

  const reportsStats = useQuery(
    api.reports.getReportsStats,
    currentUser?.accountType === "SUPERUSER" ? {} : "skip",
  )

  // Mutation
  const updateReportStatus = useMutation(api.reports.updateReportStatus)

  const formatDate = (timestamp: number) => {
    return format(new Date(timestamp), "dd/MM/yyyy 'à' HH:mm", { locale: fr })
  }

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      spam: "Spam",
      harassment: "Harcèlement",
      inappropriate_content: "Contenu inapproprié",
      fake_account: "Faux compte",
      copyright: "Violation de droits d'auteur",
      violence: "Violence",
      hate_speech: "Discours de haine",
      other: "Autre",
    }
    return labels[reason] || reason
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge
            variant="outline"
            className="border-yellow-500 bg-yellow-600 text-yellow-100"
          >
            En attente
          </Badge>
        )
      case "reviewing":
        return (
          <Badge
            variant="outline"
            className="border-blue-500 bg-blue-600 text-blue-100"
          >
            En révision
          </Badge>
        )
      case "resolved":
        return (
          <Badge
            variant="outline"
            className="border-green-500 bg-green-600 text-green-100"
          >
            Résolu
          </Badge>
        )
      case "rejected":
        return (
          <Badge
            variant="outline"
            className="border-red-500 bg-red-600 text-red-100"
          >
            Rejeté
          </Badge>
        )
      default:
        return (
          <Badge
            variant="outline"
            className="border-gray-500 bg-gray-600 text-gray-100"
          >
            {status}
          </Badge>
        )
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "user":
        return (
          <Badge
            variant="outline"
            className="border-blue-400 bg-blue-100 text-blue-800 dark:border-blue-600 dark:bg-blue-800 dark:text-blue-200"
          >
            <User className="mr-1 h-3 w-3" />
            Utilisateur
          </Badge>
        )
      case "post":
        return (
          <Badge
            variant="outline"
            className="border-purple-400 bg-purple-100 text-purple-800 dark:border-purple-600 dark:bg-purple-800 dark:text-purple-200"
          >
            <MessageSquare className="mr-1 h-3 w-3" />
            Post
          </Badge>
        )
      case "comment":
        return (
          <Badge
            variant="outline"
            className="border-green-400 bg-green-100 text-green-800 dark:border-green-600 dark:bg-green-800 dark:text-green-200"
          >
            <MessageSquare className="mr-1 h-3 w-3" />
            Commentaire
          </Badge>
        )
      default:
        return <Badge variant="outline">{type}</Badge>
    }
  }

  const handleStatusUpdate = (reportId: Id<"reports">, status: string) => {
    startTransition(async () => {
      try {
        await updateReportStatus({
          reportId,
          status: status as "pending" | "reviewing" | "resolved" | "rejected",
          adminNotes: adminNotes || undefined,
        })

        toast.success("Statut mis à jour avec succès")
        setSelectedReport(null)
        setAdminNotes("")
      } catch (error) {
        console.error(error)
        toast.error("Erreur lors de la mise à jour")
      }
    })
  }

  const renderReportCard = (report: Report) => {
    return (
      <Card key={report._id} className="transition-shadow hover:shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {getTypeBadge(report.type)}
                {getStatusBadge(report.status)}
              </div>
            </div>
            <Link href={`/superuser/reports/${report._id}`}>
              <Button variant="outline" size="sm">
                <Eye className="mr-1 h-4 w-4" />
                Voir détails
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <p className="text-muted-foreground text-sm font-medium">
                Motif du signalement
              </p>
              <p className="font-medium">{getReasonLabel(report.reason)}</p>
            </div>

            {report.description && (
              <div>
                <p className="text-muted-foreground text-sm font-medium">
                  Description
                </p>
                <p className="line-clamp-2 text-sm">{report.description}</p>
              </div>
            )}

            <div className="text-muted-foreground flex flex-col space-y-2 text-sm sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
              <div className="flex items-center">
                <Calendar className="mr-1 h-4 w-4" />
                Signalé le {formatDate(report.createdAt)}
              </div>
              <div>
                Signalé par{" "}
                {report.reporter?.username ? (
                  <Link
                    href={`/${report.reporter.username}`}
                    className="text-primary font-medium hover:underline"
                  >
                    {report.reporter.name}
                  </Link>
                ) : (
                  <span className="font-medium">{report.reporter?.name}</span>
                )}
              </div>
            </div>

            {report.type === "user" && report.reportedUser && (
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-sm font-medium">Utilisateur signalé :</p>
                <div className="mt-1 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {report.reportedUser.username ? (
                    <Link
                      href={`/${report.reportedUser.username}`}
                      className="text-primary font-medium hover:underline"
                    >
                      {report.reportedUser.name}
                    </Link>
                  ) : (
                    <span className="font-medium">
                      {report.reportedUser.name}
                    </span>
                  )}
                  <span className="text-muted-foreground">
                    @{report.reportedUser.username}
                  </span>
                </div>
              </div>
            )}

            {report.type === "post" && report.reportedPost && (
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-sm font-medium">Post signalé :</p>
                <div className="mt-1">
                  <p className="line-clamp-2 text-sm">
                    {report.reportedPost.content}
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    Par{" "}
                    {report.reportedPost.author?.username ? (
                      <Link
                        href={`/${report.reportedPost.author.username}`}
                        className="text-primary font-medium hover:underline"
                      >
                        {report.reportedPost.author.name}
                      </Link>
                    ) : (
                      <span className="font-medium">
                        {report.reportedPost.author?.name}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!allReports || !reportsStats) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-lg">Chargement...</div>
      </div>
    )
  }

  const pendingReports = allReports.filter((r) => r.status === "pending")
  const reviewingReports = allReports.filter((r) => r.status === "reviewing")
  const resolvedReports = allReports.filter((r) => r.status === "resolved")
  const rejectedReports = allReports.filter((r) => r.status === "rejected")

  return (
    <main className="border-muted flex h-full min-h-screen w-full flex-col border-r border-l max-lg:pb-16">
      {/* Header */}
      <div className="border-muted bg-background/95 sticky top-0 z-20 border-b p-4 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Signalements</h1>
          <div className="flex items-center space-x-2">
            <Badge className="border-slate-500 bg-slate-600 text-slate-100">
              {reportsStats.total} total
            </Badge>
            {reportsStats.pending > 0 && (
              <Badge className="border-red-500 bg-red-600 text-red-100">
                {reportsStats.pending} en attente
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 p-3">
        {/* Statistiques */}
        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-3">
              <div className="text-2xl font-bold text-yellow-600">
                {reportsStats.pending}
              </div>
              <p className="text-muted-foreground text-xs">En attente</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="text-2xl font-bold text-blue-600">
                {reportsStats.reviewing}
              </div>
              <p className="text-muted-foreground text-xs">En révision</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="text-2xl font-bold text-green-600">
                {reportsStats.resolved}
              </div>
              <p className="text-muted-foreground text-xs">Résolus</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="text-2xl font-bold text-red-600">
                {reportsStats.rejected}
              </div>
              <p className="text-muted-foreground text-xs">Rejetés</p>
            </CardContent>
          </Card>
        </div>

        {/* Onglets */}
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pending" className="relative">
              En attente
              {pendingReports.length > 0 && (
                <Badge className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center bg-red-600 p-0 text-xs text-red-100">
                  {pendingReports.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="reviewing">
              En révision ({reviewingReports.length})
            </TabsTrigger>
            <TabsTrigger value="resolved">
              Résolus ({resolvedReports.length})
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rejetés ({rejectedReports.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-6">
            {pendingReports.length === 0 ? (
              <Card className="p-8 text-center">
                <CardHeader>
                  <CardTitle>Aucun signalement en attente</CardTitle>
                  <CardDescription>
                    Tous les signalements ont été traités.
                  </CardDescription>
                </CardHeader>
              </Card>
            ) : (
              <>
                {pendingReports.length > 0 && (
                  <Alert className="mb-4 border-orange-500 bg-orange-950/50 text-orange-100">
                    <AlertTriangle className="h-4 w-4 text-orange-400" />
                    <AlertTitle className="text-orange-200">
                      Signalements en attente
                    </AlertTitle>
                    <AlertDescription className="text-orange-300">
                      {pendingReports.length} signalement(s) nécessite(nt) votre
                      attention.
                    </AlertDescription>
                  </Alert>
                )}
                <div className="space-y-4">
                  {pendingReports.map(renderReportCard)}
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="reviewing" className="mt-6">
            <div className="space-y-4">
              {reviewingReports.map(renderReportCard)}
            </div>
          </TabsContent>

          <TabsContent value="resolved" className="mt-6">
            <div className="space-y-4">
              {resolvedReports.map(renderReportCard)}
            </div>
          </TabsContent>

          <TabsContent value="rejected" className="mt-6">
            <div className="space-y-4">
              {rejectedReports.map(renderReportCard)}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog pour les détails du signalement */}
      <Dialog
        open={selectedReport !== null}
        onOpenChange={() => setSelectedReport(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails du signalement</DialogTitle>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {getTypeBadge(selectedReport.type)}
                {getStatusBadge(selectedReport.status)}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">
                    Motif
                  </p>
                  <p className="font-medium">
                    {getReasonLabel(selectedReport.reason)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm font-medium">
                    Date
                  </p>
                  <p className="font-medium">
                    {formatDate(selectedReport.createdAt)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm font-medium">
                    Signalé par
                  </p>
                  {selectedReport.reporter?.username ? (
                    <Link
                      href={`/${selectedReport.reporter.username}`}
                      className="text-primary font-medium hover:underline"
                    >
                      {selectedReport.reporter.name}
                    </Link>
                  ) : (
                    <p className="font-medium">
                      {selectedReport.reporter?.name}
                    </p>
                  )}
                </div>
                {selectedReport.type === "user" &&
                  selectedReport.reportedUser && (
                    <div>
                      <p className="text-muted-foreground text-sm font-medium">
                        Utilisateur signalé
                      </p>
                      {selectedReport.reportedUser.username ? (
                        <Link
                          href={`/${selectedReport.reportedUser.username}`}
                          className="text-primary font-medium hover:underline"
                        >
                          {selectedReport.reportedUser.name}
                        </Link>
                      ) : (
                        <p className="font-medium">
                          {selectedReport.reportedUser.name}
                        </p>
                      )}
                    </div>
                  )}
                {selectedReport.type === "post" &&
                  selectedReport.reportedPost?.author && (
                    <div>
                      <p className="text-muted-foreground text-sm font-medium">
                        Auteur du post
                      </p>
                      {selectedReport.reportedPost.author.username ? (
                        <Link
                          href={`/${selectedReport.reportedPost.author.username}`}
                          className="text-primary font-medium hover:underline"
                        >
                          {selectedReport.reportedPost.author.name}
                        </Link>
                      ) : (
                        <p className="font-medium">
                          {selectedReport.reportedPost.author.name}
                        </p>
                      )}
                    </div>
                  )}
              </div>

              {selectedReport.description && (
                <div>
                  <p className="text-muted-foreground text-sm font-medium">
                    Description
                  </p>
                  <p className="bg-muted rounded-lg p-3 text-sm">
                    {selectedReport.description}
                  </p>
                </div>
              )}

              <div>
                <p className="text-muted-foreground mb-2 text-sm font-medium">
                  Notes administratives
                </p>
                <Textarea
                  placeholder="Ajouter des notes sur ce signalement..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="min-h-20"
                />
              </div>

              {selectedReport.status === "pending" ||
              selectedReport.status === "reviewing" ? (
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    onClick={() =>
                      handleStatusUpdate(selectedReport._id, "reviewing")
                    }
                    disabled={isPending}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Mettre en révision
                  </Button>
                  <Button
                    onClick={() =>
                      handleStatusUpdate(selectedReport._id, "resolved")
                    }
                    disabled={isPending}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Résoudre
                  </Button>
                  <Button
                    onClick={() =>
                      handleStatusUpdate(selectedReport._id, "rejected")
                    }
                    disabled={isPending}
                    variant="destructive"
                    className="flex-1"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Rejeter
                  </Button>
                </div>
              ) : (
                <div className="text-muted-foreground text-center text-sm">
                  Ce signalement a été traité le{" "}
                  {formatDate(selectedReport.reviewedAt!)}
                  {selectedReport.reviewedByUser && (
                    <span> par {selectedReport.reviewedByUser.name}</span>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  )
}

export default ReportsPage
