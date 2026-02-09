"use client"

import { useMutation, useQuery } from "convex/react"
import {
  AlertTriangle,
  ArrowLeft,
  Ban,
  Calendar,
  Check,
  Clock,
  ExternalLink,
  FileText,
  Heart,
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
import { BanUserDialog } from "@/components/superuser/ban-user-dialog"
import { RecidivistAlert } from "@/components/superuser/recidivist-alert"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { useCurrentUser } from "@/hooks/useCurrentUser"
import { cn } from "@/lib/utils"

interface ReportDetailsProps {
  params: Promise<{ report: Id<"reports"> }>
}

const statusConfig = {
  pending: {
    label: "En attente",
    className: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    iconColor: "text-amber-500",
  },
  reviewing: {
    label: "Traité",
    className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    iconColor: "text-emerald-500",
  },
  resolved: {
    label: "Traité",
    className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    iconColor: "text-emerald-500",
  },
  rejected: {
    label: "Traité",
    className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    iconColor: "text-emerald-500",
  },
}

const resolutionActionConfig = {
  banned: {
    label: "Utilisateur banni",
    className: "bg-red-500/10 text-red-600 border-red-500/20",
  },
  content_deleted: {
    label: "Contenu supprimé",
    className: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  },
  dismissed: {
    label: "Classé sans suite",
    className: "bg-slate-500/10 text-slate-600 border-slate-500/20",
  },
}

const typeConfig = {
  user: {
    label: "Utilisateur",
    icon: User,
    className: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
  },
  post: {
    label: "Publication",
    icon: FileText,
    className: "bg-violet-500/10 text-violet-600 border-violet-500/20",
  },
  comment: {
    label: "Commentaire",
    icon: MessageSquare,
    className: "bg-fuchsia-500/10 text-fuchsia-600 border-fuchsia-500/20",
  },
}

const reasonLabels: Record<string, string> = {
  spam: "Spam",
  harassment: "Harcèlement",
  inappropriate_content: "Contenu inapproprié",
  fake_account: "Faux compte",
  copyright: "Droits d'auteur",
  violence: "Violence",
  hate_speech: "Discours de haine",
  other: "Autre",
}

export default function ReportDetailsPage({ params }: ReportDetailsProps) {
  const { report: reportId } = use(params)
  const { currentUser } = useCurrentUser()
  const [adminNotes, setAdminNotes] = useState("")
  const [isPending, startTransition] = useTransition()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showBanDialog, setShowBanDialog] = useState(false)
  const [notesInitialized, setNotesInitialized] = useState(false)

  const report = useQuery(
    api.reports.getReportById,
    currentUser?.accountType === "SUPERUSER" ? { reportId } : "skip",
  )

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

  // Initialize admin notes once
  if (!notesInitialized && report?.adminNotes) {
    setAdminNotes(report.adminNotes)
    setNotesInitialized(true)
  }

  const formatShortDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  const handleStatusUpdate = (
    status: "pending" | "resolved",
    resolutionAction?: "banned" | "content_deleted" | "dismissed",
  ) => {
    if (!report) return

    startTransition(async () => {
      try {
        await updateReportStatus({
          reportId: report._id,
          status,
          resolutionAction,
          adminNotes: adminNotes || undefined,
        })

        toast.success(
          status === "pending" ? "Signalement rouvert" : "Signalement traité",
        )
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

  // Loading state
  if (report === undefined) {
    return (
      <div className="flex h-full flex-col overflow-y-auto">
        <div className="flex-1 space-y-4 p-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      </div>
    )
  }

  // Not found state
  if (report === null) {
    return (
      <div className="flex h-full flex-col overflow-y-auto">
        <div className="flex-1 p-4">
          <Link
            href="/superuser/reports"
            className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-2 text-sm transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux signalements
          </Link>
          <div className="flex flex-col items-center justify-center py-12">
            <div className="bg-muted/50 mb-4 flex h-16 w-16 items-center justify-center rounded-full">
              <AlertTriangle className="text-muted-foreground h-8 w-8" />
            </div>
            <h2 className="mb-2 text-xl font-semibold">
              Signalement introuvable
            </h2>
            <p className="text-muted-foreground mb-6 text-center">
              Ce signalement n&apos;existe pas ou a été supprimé.
            </p>
            <Link href="/superuser/reports">
              <Button>Retour aux signalements</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const status =
    statusConfig[report.status as keyof typeof statusConfig] ??
    statusConfig.pending
  const type =
    typeConfig[report.type as keyof typeof typeConfig] ?? typeConfig.user
  const TypeIcon = type.icon
  const canDeleteContent =
    ((report.type === "post" && report.reportedPost) ||
      (report.type === "comment" && report.reportedComment)) &&
    (report.status === "pending" || report.status === "reviewing")
  const isUrgent =
    report.status === "pending" &&
    ["harassment", "violence", "hate_speech"].includes(report.reason)

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="flex-1 space-y-4 p-4">
        {/* Back link */}
        <Link
          href="/superuser/reports"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux signalements
        </Link>

        {/* Header Card */}
        <Card className={cn(isUrgent && "border-red-500/30")}>
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className={cn("gap-1", type.className)}
                  >
                    <TypeIcon className="h-3 w-3" />
                    {type.label}
                  </Badge>
                  <Badge variant="outline" className={status.className}>
                    {status.label}
                  </Badge>
                  {isUrgent && (
                    <Badge
                      variant="outline"
                      className="gap-1 border-red-500/30 bg-red-500/10 text-red-600"
                    >
                      <AlertTriangle className="h-3 w-3" />
                      Urgent
                    </Badge>
                  )}
                </div>
                <div>
                  <h1 className="text-lg font-semibold">
                    {reasonLabels[report.reason] || report.reason}
                  </h1>
                  <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-3 text-sm">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      Signalé le {formatShortDate(report.createdAt)}
                    </span>
                    {report.reviewedAt && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        Traité le {formatShortDate(report.reviewedAt)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Reporter info */}
              <div className="bg-muted/50 flex items-center gap-3 rounded-lg p-3">
                <Avatar className="h-10 w-10 border">
                  <AvatarImage src={report.reporter?.image} />
                  <AvatarFallback className="text-xs font-medium">
                    {report.reporter?.name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2) || "?"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-muted-foreground text-xs">Signalé par</p>
                  {report.reporter?.username ? (
                    <Link
                      href={`/${report.reporter.username}`}
                      className="text-sm font-medium hover:underline"
                    >
                      @{report.reporter.username}
                    </Link>
                  ) : (
                    <p className="text-sm font-medium">
                      {report.reporter?.name}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            {report.description && (
              <div className="bg-muted/30 mt-4 rounded-lg p-3">
                <p className="text-muted-foreground mb-1 text-xs font-medium tracking-wide uppercase">
                  Description
                </p>
                <p className="text-sm">{report.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reported Content */}
        {report.type === "user" && report.reportedUser && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4" />
                Utilisateur signalé
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border">
                  <AvatarImage src={report.reportedUser.image} />
                  <AvatarFallback className="text-lg">
                    {report.reportedUser.name?.[0] || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold">{report.reportedUser.name}</p>
                  <p className="text-muted-foreground text-sm">
                    @{report.reportedUser.username || "N/A"}
                  </p>
                  {report.reportedUser.email && (
                    <p className="text-muted-foreground text-xs">
                      {report.reportedUser.email}
                    </p>
                  )}
                  {report.reportedUser.bio && (
                    <p className="mt-2 line-clamp-2 text-sm">
                      {report.reportedUser.bio}
                    </p>
                  )}
                </div>
                <Link href={`/${report.reportedUser.username}`} target="_blank">
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <ExternalLink className="h-3.5 w-3.5" />
                    Voir profil
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recidivist Alert - show for the user behind the reported content */}
        {report.type === "user" && report.reportedUser && (
          <RecidivistAlert
            userId={report.reportedUser._id}
            username={report.reportedUser.username || undefined}
          />
        )}
        {report.type === "post" && report.reportedPost?.author?._id && (
          <RecidivistAlert
            userId={report.reportedPost.author._id}
            username={report.reportedPost.author.username || undefined}
          />
        )}
        {report.type === "comment" && report.reportedComment?.author?._id && (
          <RecidivistAlert
            userId={report.reportedComment.author._id}
            username={report.reportedComment.author.username || undefined}
          />
        )}

        {report.type === "post" && report.reportedPost && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4" />
                Publication signalée
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Post author */}
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border">
                  <AvatarImage src={report.reportedPost.author?.image} />
                  <AvatarFallback className="text-xs">
                    {report.reportedPost.author?.name?.[0] || "?"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">
                    {report.reportedPost.author?.name}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    @{report.reportedPost.author?.username} •{" "}
                    {formatShortDate(report.reportedPost._creationTime)}
                  </p>
                </div>
              </div>

              {/* Post content */}
              <div className="bg-muted/30 rounded-lg p-4">
                <p className="text-sm whitespace-pre-wrap">
                  {report.reportedPost.content}
                </p>
                {report.reportedPost.medias &&
                  report.reportedPost.medias.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      {report.reportedPost.medias
                        .slice(0, 4)
                        .map((media: string | { url: string }, index: number) => (
                          <div
                            key={index}
                            className="bg-muted relative aspect-video overflow-hidden rounded-lg"
                          >
                            <Image
                              src={typeof media === "string" ? media : media.url}
                              alt={`Média ${index + 1}`}
                              fill
                              className="object-cover"
                            />
                            {index === 3 &&
                              report.reportedPost?.medias &&
                              report.reportedPost.medias.length > 4 && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                  <span className="text-lg font-bold text-white">
                                    +{report.reportedPost.medias.length - 4}
                                  </span>
                                </div>
                              )}
                          </div>
                        ))}
                    </div>
                  )}
              </div>

              {/* Post stats */}
              <div className="text-muted-foreground flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1">
                  <Heart className="h-4 w-4" />
                  {postLikeCount?.count ?? 0}
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  {postCommentCount?.count ?? 0}
                </span>
                <Badge variant="outline" className="text-xs">
                  {report.reportedPost.visibility === "subscribers_only"
                    ? "Abonnés"
                    : "Public"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {report.type === "comment" && report.reportedComment && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageSquare className="h-4 w-4" />
                Commentaire signalé
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Comment author */}
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border">
                  <AvatarImage src={report.reportedComment.author?.image} />
                  <AvatarFallback className="text-xs">
                    {report.reportedComment.author?.name?.[0] || "?"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">
                    {report.reportedComment.author?.name}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    @{report.reportedComment.author?.username} •{" "}
                    {formatShortDate(report.reportedComment._creationTime)}
                  </p>
                </div>
              </div>

              {/* Comment content */}
              <div className="bg-muted/30 rounded-lg p-4">
                <p className="text-sm whitespace-pre-wrap">
                  {report.reportedComment.content}
                </p>
              </div>

              {/* Parent post */}
              {report.reportedComment.post && (
                <div className="rounded-lg border border-dashed p-3">
                  <p className="text-muted-foreground mb-1 text-xs font-medium">
                    Commentaire sur le post:
                  </p>
                  <p className="line-clamp-2 text-sm">
                    {report.reportedComment.post.content}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Admin Notes */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4" />
              Notes administratives
            </CardTitle>
          </CardHeader>
          <CardContent>
            {report.status === "pending" || report.status === "reviewing" ? (
              <Textarea
                placeholder="Ajoutez des notes sur ce signalement..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="min-h-24 resize-none"
              />
            ) : (
              <div className="bg-muted/30 rounded-lg p-4">
                <p className="text-sm whitespace-pre-wrap">
                  {report.adminNotes || "Aucune note administrative"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions - Simplified */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Actions</CardTitle>
          </CardHeader>
          <CardContent>
            {report.status === "pending" || report.status === "reviewing" ? (
              /* Actions for pending reports */
              <div className="space-y-3">
                {/* Ban user option */}
                {report.reportedUser && !report.reportedUser.isBanned && (
                  <Button
                    onClick={() => setShowBanDialog(true)}
                    disabled={isPending}
                    variant="outline"
                    className="w-full gap-2 border-red-500/30 bg-red-500/5 text-red-600 hover:bg-red-500/10 hover:text-red-700"
                  >
                    <Ban className="h-4 w-4" />
                    Bannir{" "}
                    {report.reportedUser.username
                      ? `@${report.reportedUser.username}`
                      : "l'utilisateur"}
                  </Button>
                )}

                {/* Delete content option */}
                {canDeleteContent && (
                  <Button
                    onClick={() => setShowDeleteDialog(true)}
                    disabled={isPending}
                    variant="outline"
                    className="w-full gap-2 border-orange-500/30 bg-orange-500/5 text-orange-600 hover:bg-orange-500/10 hover:text-orange-700"
                  >
                    <Trash2 className="h-4 w-4" />
                    Supprimer le contenu
                  </Button>
                )}

                {/* Dismiss option */}
                <Button
                  onClick={() => handleStatusUpdate("resolved", "dismissed")}
                  disabled={isPending}
                  variant="outline"
                  className="w-full gap-2"
                >
                  <Check className="h-4 w-4" />
                  Classer sans suite
                </Button>
              </div>
            ) : (
              /* View for resolved reports */
              <div className="space-y-4">
                <div className="bg-muted/30 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={status.className}>
                          {status.label}
                        </Badge>
                        {report.resolutionAction && (
                          <Badge
                            variant="outline"
                            className={
                              resolutionActionConfig[
                                report.resolutionAction as keyof typeof resolutionActionConfig
                              ]?.className
                            }
                          >
                            {
                              resolutionActionConfig[
                                report.resolutionAction as keyof typeof resolutionActionConfig
                              ]?.label
                            }
                          </Badge>
                        )}
                      </div>
                      {report.reviewedByUser && report.reviewedAt && (
                        <p className="text-muted-foreground text-sm">
                          Par {report.reviewedByUser.name} le{" "}
                          {formatShortDate(report.reviewedAt)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Reopen option */}
                <Button
                  onClick={() => handleStatusUpdate("pending")}
                  disabled={isPending}
                  variant="outline"
                  className="w-full gap-2"
                >
                  <X className="h-4 w-4" />
                  Rouvrir le signalement
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Supprimer le contenu
            </DialogTitle>
            <DialogDescription>
              Cette action est irréversible. Le contenu signalé sera
              définitivement supprimé.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert className="border-destructive/30 bg-destructive/5">
              <AlertTriangle className="text-destructive h-4 w-4" />
              <AlertTitle className="text-destructive">Attention</AlertTitle>
              <AlertDescription className="text-destructive/80">
                {report.type === "post" &&
                  "Le post, ses commentaires, likes et bookmarks seront supprimés."}
                {report.type === "comment" &&
                  "Le commentaire et ses données associées seront supprimés."}
              </AlertDescription>
            </Alert>
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Note administrative
              </label>
              <Textarea
                placeholder="Raison de la suppression..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
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
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ban User Dialog */}
      {report.reportedUser && (
        <BanUserDialog
          userId={report.reportedUser._id}
          username={report.reportedUser.username || undefined}
          reportId={report._id}
          isOpen={showBanDialog}
          onClose={() => setShowBanDialog(false)}
        />
      )}
    </div>
  )
}
