"use client"

import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { UpdateImages } from "@/components/domains/users"
import { EditProfileForm } from "@/components/shared/edit-profile-form"
import { ImageUploadInfo } from "@/components/shared/image-upload-info"
import { Label } from "@/components/ui/label"
import { useCurrentUser } from "@/hooks/useCurrentUser"

const OnboardingPage = () => {
  const router = useRouter()
  const { currentUser, isLoading } = useCurrentUser()

  if (isLoading || currentUser === undefined) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <Loader2 className="text-primary h-12 w-12 animate-spin" />
        <p className="text-muted-foreground mt-4 text-lg">
          Préparation de votre profil...
        </p>
      </div>
    )
  }

  // Redirection si l'utilisateur a déjà un username (profil complété)
  if (currentUser?.username) {
    router.push("/")
    return null
  }

  // Si currentUser est null après le chargement, erreur
  if (!currentUser) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <Loader2 className="text-primary h-12 w-12 animate-spin" />
        <p className="text-muted-foreground mt-4 text-lg">
          Erreur de chargement du profil...
        </p>
      </div>
    )
  }

  return (
    <div className="container mx-auto my-4 max-w-2xl">
      <div className="mb-4">
        <div className="text-3xl leading-none font-semibold tracking-tight max-sm:text-xl">
          Finalisation de votre profil
        </div>
        <div className="text-muted-foreground mt-2 text-sm">
          Veuillez compléter vos informations pour la finalisation de votre
          profil. Pas de soucis, vous pourrez les modifier à tout moment.
        </div>
      </div>

      <div className="mb-2 flex items-center justify-between">
        <Label>Photo de bannière et de profil</Label>
        <ImageUploadInfo />
      </div>

      <UpdateImages currentUser={currentUser} />

      <EditProfileForm currentUser={currentUser} />
    </div>
  )
}

export default OnboardingPage
