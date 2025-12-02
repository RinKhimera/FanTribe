"use client"

import { useMutation, useQuery } from "convex/react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Camera, Check, Edit, FileText, Shield, User, X } from "lucide-react"
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { useCurrentUser } from "@/hooks/useCurrentUser"
import { getStatusBadge } from "@/lib/ui"
import { detectRiskFactors, getRiskBadge } from "@/lib/validators"

interface ApplicationDetailsProps {
  params: Promise<{ application: Id<"creatorApplications"> }>
}

const ApplicationDetails = ({ params }: ApplicationDetailsProps) => {
  const { application: applicationId } = use(params)
  const { currentUser } = useCurrentUser()
  const [adminNotes, setAdminNotes] = useState("")
  const [isPending, startTransition] = useTransition()
  const [selectedImage, setSelectedImage] = useState<{
    url: string
    alt: string
  } | null>(null)
  const [isEditingStatus, setIsEditingStatus] = useState(false)

  const application = useQuery(
    api.creatorApplications.getApplicationById,
    currentUser?.accountType === "SUPERUSER"
      ? { applicationId: applicationId }
      : "skip",
  )

  // Query pour toutes les applications (pour la détection de risques)
  const allApplications = useQuery(
    api.creatorApplications.getAllApplications,
    currentUser?.accountType === "SUPERUSER" ? {} : "skip",
  )

  const reviewApplication = useMutation(
    api.creatorApplications.reviewApplication,
  )

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
            ? "Candidature approuvée ✅"
            : "Candidature rejetée ❌",
        )
      } catch (error) {
        console.error(error)
        toast.error("Erreur lors de la révision")
      }
    })
  }

  const formatDate = (timestamp: number) => {
    return format(new Date(timestamp), "dd/MM/yyyy 'à' HH:mm", { locale: fr })
  }

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case "identity_card":
        return "Carte d'identité"
      case "passport":
        return "Passeport"
      case "driving_license":
        return "Permis de conduire"
      case "selfie":
        return "Selfie"
      default:
        return type
    }
  }

  // États de chargement
  if (!application || !allApplications) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-lg">Chargement...</div>
      </div>
    )
  }

  // Cas où l'application n'existe pas (ID invalide ou application supprimée)
  if (application === null) {
    return (
      <main className="border-muted flex h-full min-h-screen w-full flex-col border-r border-l sm:w-[80%] lg:w-[60%]">
        <div className="border-muted bg-background/95 sticky top-0 z-20 border-b p-4 backdrop-blur-sm">
          <h1 className="text-xl font-bold">Candidature introuvable</h1>
        </div>
        <div className="flex flex-1 items-center justify-center p-6">
          <Card className="max-w-md text-center">
            <CardHeader>
              <CardTitle>Candidature introuvable</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Cette candidature n&apos;existe pas ou a été supprimée.
              </p>
              <Link href="/superuser/creator-applications">
                <Button className="w-full">Retour aux candidatures</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  // Calcul des facteurs de risque
  const riskFactors = detectRiskFactors(application, allApplications)
  const hasRisk = riskFactors.length > 0

  // Initialiser les notes admin
  if (adminNotes === "" && application.adminNotes) {
    setAdminNotes(application.adminNotes)
  }

  return (
    <main className="border-muted flex h-full min-h-screen w-full flex-col border-r border-l max-lg:pb-12 sm:w-[80%] lg:w-[60%]">
      {/* Header avec bouton retour */}
      <div className="border-muted bg-background/95 sticky top-0 z-20 border-b p-4 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <h1 className="text-xl font-bold">
              Candidature de {application.personalInfo.fullName}
            </h1>
            <p className="text-muted-foreground text-sm">
              Soumise le {formatDate(application.submittedAt)}
              {application.reviewedAt && (
                <span className="ml-2">
                  • Traitée le {formatDate(application.reviewedAt)}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(application.status)}
            {hasRisk &&
              application.status === "pending" &&
              getRiskBadge(riskFactors)}
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-6 p-6">
        {/* Alertes de risque */}
        {hasRisk && application.status === "pending" && (
          <Alert className="border-orange-500 bg-orange-950/50 text-orange-100">
            <Shield className="h-4 w-4 text-orange-400" />
            <AlertTitle className="text-orange-200">
              Candidature à risque détectée
            </AlertTitle>
            <AlertDescription className="text-orange-300">
              <ul className="mt-2 space-y-1">
                {riskFactors.map((factor, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="font-medium text-orange-400">•</span>
                    <span>{factor.message}</span>
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Informations utilisateur */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5" />
              Informations utilisateur
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link href={`/${application.user?.username}`}>
              <div className="hover:bg-muted/50 flex cursor-pointer items-center space-x-4 rounded-lg p-2 transition-colors">
                <div className="bg-muted flex h-12 w-12 items-center justify-center overflow-hidden rounded-full">
                  {application.user?.image ? (
                    <Image
                      src={application.user.image}
                      alt={application.user.name}
                      width={48}
                      height={48}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-6 w-6" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{application.user?.name}</h3>
                  <p className="text-muted-foreground text-sm">
                    @{application.user?.username || "N/A"} •{" "}
                    {application.user?.email}
                  </p>
                </div>
                <div className="text-muted-foreground text-xs">
                  Cliquez pour voir le profil
                </div>
              </div>
            </Link>
          </CardContent>
        </Card>

        {/* Informations personnelles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5" />
              Informations personnelles
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <p className="text-muted-foreground text-sm font-medium">
                Nom complet
              </p>
              <p className="font-medium">{application.personalInfo.fullName}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium">
                Date de naissance
              </p>
              <p className="font-medium">
                {application.personalInfo.dateOfBirth}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium">
                Téléphone
              </p>
              <p className="font-medium">
                {application.personalInfo.phoneNumber}
              </p>
            </div>
            <div className="md:col-span-2">
              <p className="text-muted-foreground text-sm font-medium">
                Adresse
              </p>
              <p className="font-medium">{application.personalInfo.address}</p>
            </div>
          </CardContent>
        </Card>

        {/* Documents d'identité */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Camera className="h-5 w-5" />
              Documents d&apos;identité
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {application.identityDocuments.map((doc, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {getDocumentTypeLabel(doc.type)}
                    </span>
                    <Badge variant={"outline"}>
                      {formatDate(doc.uploadedAt)}
                    </Badge>
                  </div>
                  <div
                    className="bg-muted relative aspect-video cursor-pointer overflow-hidden rounded-lg border transition-opacity hover:opacity-90"
                    onClick={() =>
                      setSelectedImage({
                        url: doc.url,
                        alt: getDocumentTypeLabel(doc.type),
                      })
                    }
                  >
                    <Image
                      src={doc.url}
                      alt={getDocumentTypeLabel(doc.type)}
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Motivations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Motivations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {application.applicationReason}
            </p>
          </CardContent>
        </Card>

        {/* Notes admin */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Notes administratives
              {isEditingStatus && (
                <span className="text-muted-foreground ml-2 text-sm font-normal">
                  (Modifiable)
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {application.status === "pending" || isEditingStatus ? (
              <Textarea
                placeholder="Ajoutez des notes sur cette candidature..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="min-h-20"
              />
            ) : (
              <div className="bg-muted rounded-lg p-4">
                <p className="text-sm whitespace-pre-wrap">
                  {application.adminNotes || "Aucune note administrative"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <Card className="@container">
          <CardHeader>
            <CardTitle className="text-lg">Actions</CardTitle>
          </CardHeader>
          <CardContent>
            {application.status === "pending" ? (
              <div className="flex flex-col gap-3 @md:flex-row">
                <Button
                  onClick={() => handleReview("approved")}
                  disabled={isPending}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <Check className="mr-2 h-4 w-4" />
                  Approuver
                </Button>
                <Button
                  onClick={() => handleReview("rejected")}
                  disabled={isPending}
                  variant="destructive"
                  className="flex-1"
                >
                  <X className="mr-2 h-4 w-4" />
                  Rejeter
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-col gap-3 @md:flex-row @md:items-center @md:justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm font-medium">
                      Statut actuel
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      {getStatusBadge(application.status)}
                      <span className="text-muted-foreground text-sm">
                        • Traitée le {formatDate(application.reviewedAt!)}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingStatus(true)}
                    className="gap-2 @md:mt-0"
                  >
                    <Edit className="h-4 w-4" />
                    Modifier
                  </Button>
                </div>

                {isEditingStatus && (
                  <div className="bg-muted/50 space-y-3 rounded-lg border p-4">
                    <p className="text-sm font-medium">
                      Modifier le statut de la candidature
                    </p>
                    <div className="flex flex-col gap-3 @md:flex-row">
                      <Button
                        onClick={() => {
                          handleReview("approved")
                          setIsEditingStatus(false)
                        }}
                        disabled={isPending}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <Check className="mr-2 h-4 w-4" />
                        Approuver
                      </Button>
                      <Button
                        onClick={() => {
                          handleReview("rejected")
                          setIsEditingStatus(false)
                        }}
                        disabled={isPending}
                        variant="destructive"
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

      {/* Dialog pour afficher l'image en grand */}
      <Dialog
        open={selectedImage !== null}
        onOpenChange={() => setSelectedImage(null)}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedImage?.alt}</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center">
            <div className="relative max-h-[80vh] max-w-full overflow-hidden rounded-lg">
              {selectedImage && (
                <Image
                  src={selectedImage.url}
                  alt={selectedImage.alt}
                  width={800}
                  height={600}
                  className="object-contain"
                />
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  )
}

export default ApplicationDetails
