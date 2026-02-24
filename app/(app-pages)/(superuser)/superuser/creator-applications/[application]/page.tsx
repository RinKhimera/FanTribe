"use client"

import { useMutation, useQuery } from "convex/react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Camera,
  Check,
  ExternalLink,
  FileText,
  History,
  Mail,
  MapPin,
  MessageCircle,
  RefreshCw,
  ShieldAlert,
  ShieldOff,
  User,
  Wallet,
  X,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { use, useState, useTransition } from "react"
import { toast } from "sonner"
import { MediaLightbox } from "@/components/shared/media-lightbox"
import { RevokeCreatorDialog } from "@/components/superuser/revoke-creator-dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { useCurrentUser } from "@/hooks/useCurrentUser"
import { detectRiskFactors } from "@/lib/validators/detect-risk-factors"
import { cn } from "@/lib/utils"

interface ApplicationDetailsProps {
  params: Promise<{ application: Id<"creatorApplications"> }>
}

const statusConfig = {
  pending: {
    label: "En attente",
    className: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  },
  approved: {
    label: "Approuvé",
    className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  },
  rejected: {
    label: "Rejeté",
    className: "bg-rose-500/10 text-rose-600 border-rose-500/20",
  },
}

const documentTypeLabels: Record<string, string> = {
  identity_card: "Carte d'identité",
  passport: "Passeport",
  driving_license: "Permis de conduire",
  selfie: "Selfie",
}

export default function ApplicationDetails({ params }: ApplicationDetailsProps) {
  const { application: applicationId } = use(params)
  const { currentUser } = useCurrentUser()
  const [adminNotes, setAdminNotes] = useState("")
  const [notesInitialized, setNotesInitialized] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerIndex, setViewerIndex] = useState(0)
  const [showRevokeDialog, setShowRevokeDialog] = useState(false)

  const application = useQuery(
    api.creatorApplications.getApplicationById,
    currentUser?.accountType === "SUPERUSER"
      ? { applicationId: applicationId }
      : "skip",
  )

  const allApplications = useQuery(
    api.creatorApplications.getAllApplications,
    currentUser?.accountType === "SUPERUSER" ? {} : "skip",
  )

  const reviewApplication = useMutation(
    api.creatorApplications.reviewApplication,
  )

  // Initialize admin notes during render (not in useEffect to avoid cascading renders)
  if (application?.adminNotes && !notesInitialized) {
    setAdminNotes(application.adminNotes)
    setNotesInitialized(true)
  }

  const handleReview = (decision: "approved" | "rejected") => {
    if (!application) return

    startTransition(async () => {
      try {
        await reviewApplication({
          applicationId: application._id,
          decision,
          adminNotes: adminNotes || undefined,
        })
        toast.success(
          decision === "approved"
            ? "Candidature approuvée"
            : "Candidature rejetée",
        )
      } catch (error) {
        console.error(error)
        toast.error("Erreur lors de la révision")
      }
    })
  }

  const formatDate = (timestamp: number) => {
    return format(new Date(timestamp), "d MMM yyyy 'à' HH:mm", { locale: fr })
  }

  // Loading state
  if (!application || !allApplications) {
    return <LoadingSkeleton />
  }

  // Not found state
  if (application === null) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8">
        <div className="bg-muted/50 mb-4 flex h-16 w-16 items-center justify-center rounded-full">
          <FileText className="text-muted-foreground h-8 w-8" aria-hidden="true" />
        </div>
        <h2 className="mb-2 text-xl font-semibold">Candidature introuvable</h2>
        <p className="text-muted-foreground mb-6 text-center">
          Cette candidature n&apos;existe pas ou a été supprimée.
        </p>
        <Link href="/superuser/creator-applications">
          <Button>
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
            Retour aux candidatures
          </Button>
        </Link>
      </div>
    )
  }

  const riskFactors = detectRiskFactors(application, allApplications)
  const hasRisk = riskFactors.length > 0
  const status = statusConfig[application.status] ?? statusConfig.pending

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="flex-1 space-y-6 p-4 md:p-6">
        {/* Back link + Status header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link
              href="/superuser/creator-applications"
              className="text-muted-foreground hover:text-foreground mb-2 inline-flex items-center gap-1 text-sm transition-colors"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Retour aux candidatures
            </Link>
            <h1 className="text-2xl font-bold">
              {application.personalInfo.fullName}
            </h1>
            <p className="text-muted-foreground mt-1 flex items-center gap-2 text-sm">
              <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
              Soumise le {formatDate(application.submittedAt)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={cn("text-sm", status.className)}>
              {status.label}
            </Badge>
            {/* Badge tentative multiple */}
            {(application.attemptNumber ?? 1) > 1 && (
              <Badge
                variant="outline"
                className={cn(
                  "text-sm font-semibold",
                  (application.attemptNumber ?? 1) >= 3
                    ? "border-red-500/30 bg-red-500/10 text-red-600"
                    : "border-orange-500/30 bg-orange-500/10 text-orange-600"
                )}
              >
                <RefreshCw className="mr-1 h-3 w-3" aria-hidden="true" />
                Tentative #{application.attemptNumber}
              </Badge>
            )}
            {hasRisk && application.status === "pending" && (
              <Badge
                variant="outline"
                className="border-orange-500/30 bg-orange-500/10 text-orange-600"
              >
                <AlertTriangle className="mr-1 h-3 w-3" aria-hidden="true" />
                {riskFactors.length} risque(s)
              </Badge>
            )}
          </div>
        </div>

        {/* Risk Alert */}
        {hasRisk && application.status === "pending" && (
          <Alert className="border-orange-500/30 bg-orange-500/5">
            <ShieldAlert className="h-4 w-4 text-orange-500" />
            <AlertDescription>
              <p className="mb-2 font-medium text-orange-700 dark:text-orange-400">
                Facteurs de risque détectés
              </p>
              <ul className="space-y-1">
                {riskFactors.map((factor, index) => (
                  <li
                    key={index}
                    className="text-muted-foreground flex items-start gap-2 text-sm"
                  >
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-orange-500" />
                    {factor.message}
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* User Card */}
        <Card>
          <CardContent className="p-4">
            <Link
              href={`/${application.user?.username}`}
              className="group flex items-center gap-4"
            >
              <Avatar className="h-14 w-14 border-2">
                <AvatarImage src={application.user?.image} />
                <AvatarFallback className="text-lg font-medium">
                  {application.personalInfo.fullName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-lg font-semibold">
                    {application.user?.name}
                  </p>
                  <ExternalLink className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-60" aria-hidden="true" />
                </div>
                <p className="text-muted-foreground truncate text-sm">
                  @{application.user?.username}
                </p>
                <p className="text-muted-foreground truncate text-xs">
                  {application.user?.email}
                </p>
              </div>
            </Link>
          </CardContent>
        </Card>

        {/* Historique des tentatives - visible uniquement si tentative > 1 */}
        {(application.attemptNumber ?? 1) > 1 && (
          <Alert
            className={cn(
              (application.attemptNumber ?? 1) >= 3
                ? "border-red-500/30 bg-red-500/5"
                : "border-orange-500/30 bg-orange-500/5"
            )}
          >
            <History
              className={cn(
                "h-4 w-4",
                (application.attemptNumber ?? 1) >= 3
                  ? "text-red-500"
                  : "text-orange-500"
              )}
            />
            <AlertDescription>
              <p
                className={cn(
                  "mb-2 font-medium",
                  (application.attemptNumber ?? 1) >= 3
                    ? "text-red-700 dark:text-red-400"
                    : "text-orange-700 dark:text-orange-400"
                )}
              >
                Historique des candidatures
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">
                    Numéro de tentative:
                  </span>
                  <span className="font-semibold">
                    {application.attemptNumber}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">
                    Nombre de rejets précédents:
                  </span>
                  <span className="font-semibold">
                    {application.rejectionCount ?? 0}
                  </span>
                </div>
                {application.previousRejectionReason && (
                  <div className="mt-2 rounded-lg bg-background/50 p-3">
                    <p className="text-muted-foreground mb-1 text-xs font-medium">
                      Raison du rejet précédent:
                    </p>
                    <p className="text-sm italic">
                      &quot;{application.previousRejectionReason}&quot;
                    </p>
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Personal Info Grid */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4" aria-hidden="true" />
              Informations personnelles
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <InfoField
              icon={User}
              label="Nom complet"
              value={application.personalInfo.fullName}
            />
            <InfoField
              icon={Calendar}
              label="Date de naissance"
              value={application.personalInfo.dateOfBirth}
            />
            <InfoField
              icon={MessageCircle}
              label="WhatsApp"
              value={application.personalInfo.whatsappNumber ?? "—"}
            />
            <InfoField
              icon={Wallet}
              label="Mobile Money"
              value={application.personalInfo.mobileMoneyNumber ?? "—"}
            />
            {application.personalInfo.mobileMoneyNumber2 && (
              <InfoField
                icon={Wallet}
                label="Mobile Money 2"
                value={application.personalInfo.mobileMoneyNumber2}
              />
            )}
            <InfoField
              icon={Mail}
              label="Email"
              value={application.user?.email ?? "—"}
            />
            <div className="sm:col-span-2">
              <InfoField
                icon={MapPin}
                label="Adresse"
                value={application.personalInfo.address}
              />
            </div>
          </CardContent>
        </Card>

        {/* Identity Documents */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Camera className="h-4 w-4" aria-hidden="true" />
              Documents d&apos;identité
              <Badge variant="secondary" className="ml-auto">
                {application.identityDocuments.length} fichier(s)
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {application.identityDocuments.map((doc, index) => (
                <div key={index} className="group space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {documentTypeLabels[doc.type] ?? doc.type}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {formatDate(doc.uploadedAt)}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setViewerIndex(index)
                      setViewerOpen(true)
                    }}
                    className="relative aspect-video w-full cursor-pointer overflow-hidden rounded-lg border bg-muted transition-shadow hover:ring-2 hover:ring-primary/50"
                  >
                    <Image
                      src={doc.url}
                      alt={documentTypeLabels[doc.type] ?? doc.type}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/20">
                      <span className="rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                        Agrandir
                      </span>
                    </div>
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Motivation */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" aria-hidden="true" />
              Motivation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {application.applicationReason}
            </p>
          </CardContent>
        </Card>

        {/* Admin Notes */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Notes administratives</CardTitle>
          </CardHeader>
          <CardContent>
            {application.status === "pending" ? (
              <Textarea
                placeholder="Ajoutez des notes sur cette candidature…"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="min-h-24 resize-none"
                aria-label="Notes administratives"
              />
            ) : (
              <div className="bg-muted/50 min-h-24 rounded-lg p-4">
                <p className="text-muted-foreground text-sm whitespace-pre-wrap">
                  {application.adminNotes || "Aucune note"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions - Décision sur la candidature */}
        <Card className="border-2">
          <CardContent className="p-4">
            {/* PENDING: Boutons Approuver et Rejeter */}
            {application.status === "pending" && (
              <div className="space-y-3">
                <p className="text-muted-foreground text-sm">
                  Décision pour cette candidature
                </p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    onClick={() => handleReview("approved")}
                    disabled={isPending}
                    className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Check className="h-4 w-4" />
                    Approuver
                  </Button>
                  <Button
                    onClick={() => handleReview("rejected")}
                    disabled={isPending}
                    variant="destructive"
                    className="flex-1 gap-2"
                  >
                    <X className="h-4 w-4" />
                    Rejeter
                  </Button>
                </div>
              </div>
            )}

            {/* APPROVED: Juste le statut, pas d'actions */}
            {application.status === "approved" && (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Approuvée le</p>
                  <p className="font-medium">
                    {application.reviewedAt
                      ? formatDate(application.reviewedAt)
                      : "—"}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                >
                  <Check className="mr-1 h-3 w-3" />
                  Candidature approuvée
                </Badge>
              </div>
            )}

            {/* REJECTED: Statut + bouton pour corriger l'erreur */}
            {application.status === "rejected" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">Rejetée le</p>
                    <p className="font-medium">
                      {application.reviewedAt
                        ? formatDate(application.reviewedAt)
                        : "—"}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="border-rose-500/30 bg-rose-500/10 text-rose-600"
                  >
                    <X className="mr-1 h-3 w-3" />
                    Candidature rejetée
                  </Badge>
                </div>
                <Button
                  onClick={() => handleReview("approved")}
                  disabled={isPending}
                  className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700"
                >
                  <Check className="h-4 w-4" />
                  Approuver (corriger l&apos;erreur)
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Révocation du statut créateur - Section séparée */}
        {application.user?.accountType === "CREATOR" && (
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardContent className="p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/15">
                    <ShieldOff className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="font-medium text-amber-700 dark:text-amber-400">
                      Statut créateur actif
                    </p>
                    <p className="text-muted-foreground text-sm">
                      Cet utilisateur est actuellement créateur sur la plateforme
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRevokeDialog(true)}
                  className="shrink-0 gap-2 border-amber-500/30 text-amber-700 hover:bg-amber-500/10 dark:text-amber-400"
                >
                  <ShieldOff className="h-4 w-4" />
                  Révoquer le statut
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Revoke Creator Dialog */}
      <RevokeCreatorDialog
        userId={application.userId}
        username={application.user?.username}
        isOpen={showRevokeDialog}
        onClose={() => setShowRevokeDialog(false)}
      />

      {/* Fullscreen Image Viewer */}
      <MediaLightbox
        slides={application.identityDocuments.map((doc) => ({ src: doc.url }))}
        index={viewerIndex}
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
        onIndexChange={setViewerIndex}
      />
    </div>
  )
}

function InfoField({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="bg-muted mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md">
        <Icon className="text-muted-foreground h-4 w-4" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="text-muted-foreground text-xs">{label}</p>
        <p className="truncate font-medium">{value}</p>
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-y-auto p-6">
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <Skeleton className="h-14 w-14 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-32" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-48" />
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-8 w-8 rounded-md" />
                <div className="space-y-1">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-5 w-32" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
