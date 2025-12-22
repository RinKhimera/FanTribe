"use client"

import { useQuery } from "convex/react"
import {
  Camera,
  CheckCircle,
  Crown,
  FileText,
  RotateCcw,
  Shield,
  Star,
  XCircle,
  Zap,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { api } from "@/convex/_generated/api"
import { useCurrentUser } from "@/hooks/useCurrentUser"

const BeCreatorPage = () => {
  const router = useRouter()
  const { currentUser } = useCurrentUser()

  // Vérifier s'il y a déjà une demande en cours
  const existingApplication = useQuery(
    api.creatorApplications.getUserApplication,
    currentUser ? { userId: currentUser._id } : "skip",
  )

  const handleStartApplication = () => {
    if (!currentUser) return

    // Rediriger vers le formulaire de candidature
    router.push("/be-creator/apply")
  }

  const features = [
    {
      icon: <Zap className="h-6 w-6 text-yellow-500" />,
      title: "Publier du contenu",
      description: "Créez et partagez vos posts avec votre audience",
    },
    {
      icon: <Star className="h-6 w-6 text-blue-500" />,
      title: "Contenu exclusif",
      description: "Proposez du contenu premium à vos abonnés",
    },
    {
      icon: <Crown className="h-6 w-6 text-purple-500" />,
      title: "Monétisation",
      description: "Gagnez de l'argent grâce à vos abonnés",
    },
  ]

  const verificationSteps = [
    {
      icon: <FileText className="h-5 w-5" />,
      title: "Remplir le formulaire",
      description: "Informations personnelles et motivations",
    },
    {
      icon: <Camera className="h-5 w-5" />,
      title: "Vérification d'identité",
      description: "Photo de pièce d'identité + selfie",
    },
    {
      icon: <Shield className="h-5 w-5" />,
      title: "Validation",
      description: "Examen par notre équipe (24-48h)",
    },
  ]

  if (!currentUser) {
    return (
      <main className="border-muted flex h-full min-h-screen w-full flex-col items-center justify-center border-r border-l max-[500px]:pb-16">
        <div className="animate-pulse text-lg">Chargement...</div>
      </main>
    )
  }

  // Si l'utilisateur est déjà créateur
  if (
    currentUser.accountType === "CREATOR" ||
    currentUser.accountType === "SUPERUSER"
  ) {
    return (
      <main className="border-muted flex h-full min-h-screen w-full flex-col border-r border-l max-[500px]:pb-16">
        <div className="border-muted bg-background/95 sticky top-0 z-20 border-b p-4 backdrop-blur-sm">
          <h1 className="text-2xl font-bold">Compte Créateur</h1>
        </div>
        <div className="flex flex-1 items-center justify-center p-6">
          <Card className="mx-auto max-w-md text-center">
            <CardHeader>
              <Crown className="text-primary mx-auto mb-4 h-16 w-16" />
              <CardTitle>Vous êtes déjà créateur !</CardTitle>
              <CardDescription>
                Votre compte créateur est actif. Vous pouvez publier du contenu.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button asChild className="w-full">
                <Link href="/new-post">Créer un post</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>
    )
  }

  // Affichage selon le statut de la demande
  const renderApplicationStatus = () => {
    if (!existingApplication) {
      return (
        <Button onClick={handleStartApplication} className="w-full" size="lg">
          <Crown className="mr-2 h-4 w-4" />
          Commencer ma candidature
        </Button>
      )
    }

    switch (existingApplication.status) {
      case "pending":
        return (
          <div className="space-y-4 text-center">
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
              <div className="mb-2 flex items-center justify-center">
                <Shield className="mr-2 h-5 w-5 text-yellow-600" />
                <span className="font-medium text-yellow-800 dark:text-yellow-200">
                  Candidature en cours d&apos;examen
                </span>
              </div>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Nous examinons votre demande. Vous recevrez une réponse sous
                24-48h.
              </p>
            </div>
            <Button disabled className="w-full">
              Candidature soumise
            </Button>
          </div>
        )

      case "approved":
        return (
          <div className="space-y-4 text-center">
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
              <div className="mb-2 flex items-center justify-center">
                <CheckCircle className="mr-2 h-5 w-5 text-green-600" />
                <span className="font-medium text-green-800 dark:text-green-200">
                  Candidature approuvée !
                </span>
              </div>
              <p className="text-sm text-green-700 dark:text-green-300">
                Félicitations ! Votre compte créateur est maintenant actif.
              </p>
            </div>
            <Button className="w-full" onClick={() => router.push("/new-post")}>
              <Crown className="mr-2 h-4 w-4" />
              Commencer à créer
            </Button>
          </div>
        )

      case "rejected":
        return (
          <div className="space-y-4 text-center">
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
              <div className="mb-2 flex items-center justify-center">
                <XCircle className="mr-2 h-5 w-5 text-red-600" />
                <span className="font-medium text-red-800 dark:text-red-200">
                  Candidature refusée
                </span>
              </div>
              {existingApplication.adminNotes && (
                <p className="mt-2 text-sm text-red-700 dark:text-red-300">
                  Raison : {existingApplication.adminNotes}
                </p>
              )}
            </div>
            <Button
              onClick={handleStartApplication}
              variant="outline"
              className="w-full"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Postuler à nouveau
            </Button>
          </div>
        )

      default:
        return (
          <Button onClick={handleStartApplication} className="w-full" size="lg">
            <Crown className="mr-2 h-4 w-4" />
            Commencer ma candidature
          </Button>
        )
    }
  }

  return (
    <main className="border-muted flex h-full min-h-screen w-full flex-col border-r border-l max-[500px]:pb-16">
      <div className="border-muted bg-background/95 sticky top-0 z-20 border-b p-4 backdrop-blur-sm">
        <h1 className="text-2xl font-bold">Devenir Créateur</h1>
      </div>

      <div className="flex-1 p-6">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8 text-center">
            <Crown className="text-primary mx-auto mb-4 h-16 w-16" />
            <h2 className="mb-4 text-3xl font-bold">
              Passez au compte Créateur
            </h2>
            <p className="text-muted-foreground text-lg">
              Débloquez toutes les fonctionnalités pour partager votre contenu
              et développer votre audience.
            </p>
          </div>

          {/* Processus de vérification */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="text-primary h-5 w-5" />
                Processus de vérification
              </CardTitle>
              <CardDescription>
                Votre sécurité et celle de la communauté sont nos priorités
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {verificationSteps.map((step, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="bg-primary/10 mt-1 rounded-full p-2">
                      {step.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold">{step.title}</h3>
                      <p className="text-muted-foreground text-sm">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Fonctionnalités */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="text-primary h-5 w-5" />
                Fonctionnalités Créateur
              </CardTitle>
              <CardDescription>
                Ce que vous débloquez en devenant créateur
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="mt-1">{feature.icon}</div>
                    <div>
                      <h3 className="font-semibold">{feature.title}</h3>
                      <p className="text-muted-foreground text-sm">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>{renderApplicationStatus()}</CardFooter>
          </Card>

          <div className="text-muted-foreground text-center text-sm">
            <p>
              En postulant, vous acceptez nos{" "}
              <Link href="/terms" className="text-primary hover:underline">
                conditions d&apos;utilisation
              </Link>{" "}
              et notre{" "}
              <Link
                href="/creator-policy"
                className="text-primary hover:underline"
              >
                politique créateur
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}

export default BeCreatorPage
