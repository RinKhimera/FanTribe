"use client"

import { useMutation, useQuery } from "convex/react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import {
  AlertTriangle,
  Calendar,
  Check,
  ChevronLeft,
  Edit,
  Eye,
  FileText,
  MessageSquare,
  Shield,
  Trash2,
  User,
  X,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { use, useState, useTransition } from "react"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { useCurrentUser } from "@/hooks/useCurrentUser"

interface ReportDetailsProps {
  params: Promise<{ report: Id<"reports"> }>
}

const ReportDetails = ({ params }: ReportDetailsProps) => {
  const { report: reportId } = use(params)
  const { currentUser } = useCurrentUser()
  const [adminNotes, setAdminNotes] = useState("")
  const [isPending, startTransition] = useTransition()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isEditingStatus, setIsEditingStatus] = useState(false)

  const report = useQuery(
    api.reports.getReportById,
    currentUser?.accountType === "SUPERUSER" ? { reportId } : "skip",
  )

  // Compteurs dynamiques pour le post signalé (si présent)
  const postLikeCount = useQuery(
    api.likes.countLikes,
    report?.reportedPost ? { postId: report.reportedPost._id } : "skip",
  )
  const postCommentCount = useQuery(
    api.comments.countForPost,
    report?.reportedPost ? { postId: report.reportedPost._id } : "skip",
  )

  const updateReportStatus = useMutation(api.reports.updateReportStatus)
  const deleteContentAndResolve = useMutation(
    api.reports.deleteReportedContentAndResolve,
  )

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
            <FileText className="mr-1 h-3 w-3" />
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

  const handleStatusUpdate = (
    status: "pending" | "reviewing" | "resolved" | "rejected",
  ) => {
    if (!report) return

    startTransition(async () => {
      try {
        await updateReportStatus({
          reportId: report._id,
          status,
          adminNotes: adminNotes || undefined,
        })

        toast.success("Statut mis à jour avec succès")
        setIsEditingStatus(false)
      } catch (error) {
        console.error(error)
        toast.error("Erreur lors de la mise à jour")
      }
    })
  }

  const handleDeleteContent = () => {
    if (!report) return

    startTransition(async () => {
      try {
        await deleteContentAndResolve({
          reportId: report._id,
          adminNotes: adminNotes || "Contenu supprimé par l'administrateur",
        })

        toast.success("Contenu supprimé et signalement résolu")
        setShowDeleteDialog(false)
      } catch (error) {
        console.error(error)
        toast.error("Erreur lors de la suppression")
      }
    })
  }

  const renderUserContent = () => {
    if (!report?.reportedUser) return null

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Utilisateur signalé
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="bg-muted flex h-16 w-16 items-center justify-center overflow-hidden rounded-full">
              {report.reportedUser.image ? (
                <Image
                  src={report.reportedUser.image}
                  alt={report.reportedUser.name}
                  width={64}
                  height={64}
                  className="rounded-full object-cover"
                />
              ) : (
                <User className="h-8 w-8" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold">
                {report.reportedUser.name}
              </h3>
              <p className="text-muted-foreground">
                @{report.reportedUser.username || "N/A"}
              </p>
              <p className="text-muted-foreground text-sm">
                {report.reportedUser.email}
              </p>
              {report.reportedUser.bio && (
                <p className="mt-2 text-sm">{report.reportedUser.bio}</p>
              )}
            </div>
            <div className="text-right">
              <Link href={`/${report.reportedUser.username}`}>
                <Button variant="outline" size="sm">
                  <Eye className="mr-2 h-4 w-4" />
                  Voir le profil
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderPostContent = () => {
    if (!report?.reportedPost) return null

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Post signalé
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Auteur du post */}
          <div className="flex items-center space-x-3">
            <div className="bg-muted flex h-10 w-10 items-center justify-center overflow-hidden rounded-full">
              {report.reportedPost.author?.image ? (
                <Image
                  src={report.reportedPost.author.image}
                  alt={report.reportedPost.author.name}
                  width={40}
                  height={40}
                  className="rounded-full object-cover"
                />
              ) : (
                <User className="h-5 w-5" />
              )}
            </div>
            <div>
              <p className="font-medium">{report.reportedPost.author?.name}</p>
              <p className="text-muted-foreground text-sm">
                @{report.reportedPost.author?.username} •{" "}
                {formatDate(report.reportedPost._creationTime)}
              </p>
            </div>
          </div>

          {/* Contenu du post */}
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm whitespace-pre-wrap">
              {report.reportedPost.content}
            </p>
            {report.reportedPost.medias &&
              report.reportedPost.medias.length > 0 && (
                <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2">
                  {report.reportedPost.medias.map((media, index) => (
                    <div
                      key={index}
                      className="relative aspect-video overflow-hidden rounded-lg"
                    >
                      <Image
                        src={media}
                        alt={`Média ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
          </div>

          {/* Statistiques du post (issues des tables likes / comments) */}
          <div className="text-muted-foreground flex items-center gap-4 text-sm">
            <span>{postLikeCount?.count ?? 0} j&apos;aime</span>
            <span>{postCommentCount?.count ?? 0} commentaires</span>
            <Badge variant="outline">
              {report.reportedPost.visibility === "subscribers_only"
                ? "Abonnés seulement"
                : "Public"}
            </Badge>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderCommentContent = () => {
    if (!report?.reportedComment) return null

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Commentaire signalé
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Auteur du commentaire */}
          <div className="flex items-center space-x-3">
            <div className="bg-muted flex h-10 w-10 items-center justify-center overflow-hidden rounded-full">
              {report.reportedComment.author?.image ? (
                <Image
                  src={report.reportedComment.author.image}
                  alt={report.reportedComment.author.name}
                  width={40}
                  height={40}
                  className="rounded-full object-cover"
                />
              ) : (
                <User className="h-5 w-5" />
              )}
            </div>
            <div>
              <p className="font-medium">
                {report.reportedComment.author?.name}
              </p>
              <p className="text-muted-foreground text-sm">
                @{report.reportedComment.author?.username} •{" "}
                {formatDate(report.reportedComment._creationTime)}
              </p>
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm whitespace-pre-wrap">
              {report.reportedComment.content}
            </p>
          </div>

          {/* Informations sur le post parent */}
          {report.reportedComment.post && (
            <div className="bg-muted/30 rounded-lg border p-3">
              <p className="text-muted-foreground mb-2 text-sm font-medium">
                Commentaire sur le post :
              </p>
              <p className="line-clamp-2 text-sm">
                {report.reportedComment.post.content}
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                Post créé le{" "}
                {formatDate(report.reportedComment.post._creationTime)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // Initialiser les notes admin
  if (adminNotes === "" && report?.adminNotes) {
    setAdminNotes(report.adminNotes)
  }

  if (!report) {
    if (report === null) {
      return (
        <main className="border-muted flex h-full min-h-screen w-full flex-col border-r border-l">
          <div className="border-muted bg-background/95 sticky top-0 z-20 border-b p-4 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <Link href="/superuser/reports">
                <Button variant="ghost" size="sm">
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Retour
                </Button>
              </Link>
              <h1 className="text-xl font-bold">Signalement introuvable</h1>
            </div>
          </div>
          <div className="flex flex-1 items-center justify-center p-6">
            <Card className="max-w-md text-center">
              <CardHeader>
                <CardTitle>Signalement introuvable</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Ce signalement n&apos;existe pas ou a été supprimé.
                </p>
                <Link href="/superuser/reports">
                  <Button className="w-full">Retour aux signalements</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </main>
      )
    }

    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-lg">Chargement...</div>
      </div>
    )
  }

  const canDeleteContent =
    ((report.type === "post" && report.reportedPost) ||
      (report.type === "comment" && report.reportedComment)) &&
    (report.status === "pending" || report.status === "reviewing")

  return (
    <main className="border-muted flex h-full min-h-screen w-full flex-col border-r border-l max-lg:pb-12">
      {/* Header */}
      <div className="border-muted bg-background/95 sticky top-0 z-20 border-b p-4 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <Link href="/superuser/reports">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Détails du signalement</h1>
            <p className="text-muted-foreground text-sm">
              Signalé le {formatDate(report.createdAt)}
              {report.reviewedAt && (
                <span className="ml-2">
                  • Traité le {formatDate(report.reviewedAt)}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {getTypeBadge(report.type)}
            {getStatusBadge(report.status)}
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-6 p-6">
        {/* Informations du signalement */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Informations du signalement
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <p className="text-muted-foreground text-sm font-medium">
                Motif du signalement
              </p>
              <p className="font-medium">{getReasonLabel(report.reason)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium">
                Type de contenu
              </p>
              <div>{getTypeBadge(report.type)}</div>
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium">
                Signalé par
              </p>
              {report.reporter?.username ? (
                <Link
                  href={`/${report.reporter.username}`}
                  className="text-primary font-medium hover:underline"
                >
                  {report.reporter.name}
                </Link>
              ) : (
                <p className="font-medium">{report.reporter?.name}</p>
              )}
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium">
                Date de signalement
              </p>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span className="font-medium">
                  {formatDate(report.createdAt)}
                </span>
              </div>
            </div>
            {report.description && (
              <div className="md:col-span-2">
                <p className="text-muted-foreground text-sm font-medium">
                  Description
                </p>
                <p className="bg-muted rounded-lg p-3 text-sm">
                  {report.description}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contenu signalé */}
        {report.type === "user" && renderUserContent()}
        {report.type === "post" && renderPostContent()}
        {report.type === "comment" && renderCommentContent()}

        {/* Notes administratives */}
        <Card>
          <CardHeader>
            <CardTitle>
              Notes administratives
              {(report.status === "pending" ||
                report.status === "reviewing" ||
                isEditingStatus) && (
                <span className="text-muted-foreground ml-2 text-sm font-normal">
                  (Modifiable)
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {report.status === "pending" ||
            report.status === "reviewing" ||
            isEditingStatus ? (
              <Textarea
                placeholder="Ajoutez des notes sur ce signalement..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="min-h-20"
              />
            ) : (
              <div className="bg-muted rounded-lg p-4">
                <p className="text-sm whitespace-pre-wrap">
                  {report.adminNotes || "Aucune note administrative"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent>
            {report.status === "pending" || report.status === "reviewing" ? (
              <div className="space-y-4">
                <div className="flex flex-col gap-3 md:flex-row">
                  <Button
                    onClick={() => handleStatusUpdate("reviewing")}
                    disabled={isPending}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Mettre en révision
                  </Button>
                  <Button
                    onClick={() => handleStatusUpdate("resolved")}
                    disabled={isPending}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Résoudre
                  </Button>
                  <Button
                    onClick={() => handleStatusUpdate("rejected")}
                    disabled={isPending}
                    variant="outline"
                    className="flex-1"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Rejeter
                  </Button>
                </div>

                {canDeleteContent && (
                  <>
                    <div className="border-muted my-4 border-t" />
                    <div className="space-y-3">
                      <Alert className="border-destructive bg-destructive/10">
                        <AlertTriangle className="text-destructive h-4 w-4" />
                        <AlertTitle className="text-destructive">
                          Action destructive
                        </AlertTitle>
                        <AlertDescription>
                          Supprimer le contenu signalé et résoudre
                          automatiquement le signalement.
                        </AlertDescription>
                      </Alert>
                      <Button
                        onClick={() => setShowDeleteDialog(true)}
                        disabled={isPending}
                        variant="destructive"
                        className="w-full"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Supprimer le contenu et résoudre
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm font-medium">
                      Statut actuel
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      {getStatusBadge(report.status)}
                      <span className="text-muted-foreground text-sm">
                        • Traité le {formatDate(report.reviewedAt!)}
                      </span>
                      {report.reviewedByUser && (
                        <span className="text-muted-foreground text-sm">
                          par {report.reviewedByUser.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingStatus(true)}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Modifier
                  </Button>
                </div>

                {isEditingStatus && (
                  <div className="bg-muted/50 space-y-3 rounded-lg border p-4">
                    <p className="text-sm font-medium">
                      Modifier le statut du signalement
                    </p>
                    <div className="flex flex-col gap-3 md:flex-row">
                      <Button
                        onClick={() => handleStatusUpdate("reviewing")}
                        disabled={isPending}
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        En révision
                      </Button>
                      <Button
                        onClick={() => handleStatusUpdate("resolved")}
                        disabled={isPending}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <Check className="mr-2 h-4 w-4" />
                        Résoudre
                      </Button>
                      <Button
                        onClick={() => handleStatusUpdate("rejected")}
                        disabled={isPending}
                        variant="outline"
                        className="flex-1"
                      >
                        <X className="mr-2 h-4 w-4" />
                        Rejeter
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditingStatus(false)}
                      className="w-full"
                    >
                      Annuler
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog de confirmation de suppression */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Supprimer le contenu
            </DialogTitle>
            <DialogDescription>
              Cette action est irréversible. Le contenu signalé sera
              définitivement supprimé et le signalement sera automatiquement
              résolu.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert className="border-destructive bg-destructive/10">
              <AlertTriangle className="text-destructive h-4 w-4" />
              <AlertTitle className="text-destructive">Attention</AlertTitle>
              <AlertDescription>
                {report.type === "post" &&
                  "Le post, tous ses commentaires, likes et bookmarks seront supprimés."}
                {report.type === "comment" &&
                  "Le commentaire et toutes ses données associées seront supprimés."}
              </AlertDescription>
            </Alert>
            <div>
              <label className="text-sm font-medium">
                Note administrative (optionnelle)
              </label>
              <Textarea
                placeholder="Raison de la suppression..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteContent}
              disabled={isPending}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Supprimer définitivement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}

export default ReportDetails
