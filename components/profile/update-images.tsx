"use client"

import { useMutation } from "convex/react"
import { SwitchCamera, X } from "lucide-react"
import Image from "next/image"
import { useTransition } from "react"
import { toast } from "sonner"
import { BunnyUploadWidget } from "@/components/shared/bunny-upload-widget"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { api } from "@/convex/_generated/api"
import { deleteBunnyAsset } from "@/lib/services/bunny"
import { cn } from "@/lib/utils"
import { UserProps } from "@/types"

export const UpdateImages = ({ currentUser }: { currentUser: UserProps }) => {
  const [isPending, startTransition] = useTransition()
  const updateProfileImage = useMutation(api.users.updateProfileImage)
  const updateBannerImage = useMutation(api.users.updateBannerImage)

  // Fonction helper pour extraire le mediaId depuis l'URL Bunny
  const extractMediaIdFromUrl = (url: string): string | null => {
    try {
      // Pour les images: https://cdn.fantribe.io/userId/randomId.ext
      // On veut récupérer "userId/randomId.ext" comme mediaId
      const urlParts = url.split("/")

      // Trouver l'index du domaine cdn.fantribe.io et récupérer tout ce qui suit
      const domainIndex = urlParts.findIndex((part) =>
        part.includes("cdn.fantribe.io"),
      )
      if (domainIndex !== -1 && urlParts.length > domainIndex + 1) {
        // Récupérer tous les segments après le domaine (userId/randomId.ext)
        const mediaIdParts = urlParts.slice(domainIndex + 1)
        return mediaIdParts.join("/") || null
      }

      return null
    } catch {
      return null
    }
  }

  const handleUploadProfile = async (result: {
    url: string
    mediaId: string
    type: "image" | "video"
  }) => {
    startTransition(async () => {
      try {
        // Supprimer l'ancienne image de profil si elle existe et n'est pas le placeholder
        if (
          currentUser?.image &&
          !currentUser.image.includes("placeholder.jpg") &&
          currentUser.image.includes("cdn.fantribe.io")
        ) {
          const oldMediaId = extractMediaIdFromUrl(currentUser.image)
          if (oldMediaId) {
            try {
              await deleteBunnyAsset(oldMediaId, "image")
            } catch (error) {
              console.warn(
                "Impossible de supprimer l'ancienne image de profil:",
                error,
              )
            }
          }
        }

        await updateProfileImage({
          imgUrl: result.url,
          tokenIdentifier: currentUser?.tokenIdentifier!,
        })
        toast.success("Photo de profil mise à jour")
      } catch (error) {
        console.error(error)
        toast.error("Une erreur s'est produite !", {
          description:
            "Veuillez vérifier votre connexion internet et réessayer",
        })
      }
    })
  }

  const handleUploadBanner = async (result: {
    url: string
    mediaId: string
    type: "image" | "video"
  }) => {
    startTransition(async () => {
      try {
        // Supprimer l'ancienne bannière si elle existe et n'est pas le placeholder
        if (
          currentUser?.imageBanner &&
          !currentUser.imageBanner.includes("placeholder.jpg") &&
          currentUser.imageBanner.includes("cdn.fantribe.io")
        ) {
          const oldMediaId = extractMediaIdFromUrl(currentUser.imageBanner)
          if (oldMediaId) {
            try {
              await deleteBunnyAsset(oldMediaId, "image")
            } catch (error) {
              console.warn(
                "Impossible de supprimer l'ancienne bannière:",
                error,
              )
            }
          }
        }

        await updateBannerImage({
          bannerUrl: result.url,
          tokenIdentifier: currentUser?.tokenIdentifier!,
        })
        toast.success("Bannière mise à jour")
      } catch (error) {
        console.error(error)
        toast.error("Une erreur s'est produite !", {
          description:
            "Veuillez vérifier votre connexion internet et réessayer",
        })
      }
    })
  }

  const handleDeleteBanner = () => {
    startTransition(async () => {
      try {
        await updateBannerImage({
          bannerUrl: "https://cdn.fantribe.io/fantribe/placeholder.jpg",
          tokenIdentifier: currentUser?.tokenIdentifier!,
        })

        toast.success("Votre photo de bannière a été supprimée")
      } catch (error) {
        console.error(error)
        toast.error("Une erreur s'est produite !", {
          description:
            "Veuillez vérifier votre connexion internet et réessayer",
        })
      }
    })
  }

  return (
    <div className="relative">
      <div>
        <AspectRatio ratio={3 / 1} className="bg-muted relative">
          <Image
            src={
              currentUser?.imageBanner ||
              "https://cdn.fantribe.io/fantribe/placeholder.jpg"
            }
            alt={currentUser?.name as string}
            className="object-cover"
            fill
          />

          <div className="absolute inset-0 flex items-center justify-center gap-6 bg-black/60 transition duration-300 hover:opacity-100 md:opacity-0">
            <BunnyUploadWidget
              userId={currentUser?._id!}
              fileName={`${currentUser?._id}/banner`}
              uploadType="image"
              onSuccess={handleUploadBanner}
            >
              {({ open }) => {
                return (
                  <div
                    className={cn(
                      "bg-accent hover:bg-accent/60 flex size-11 cursor-pointer items-center justify-center rounded-full text-white transition",
                      { "cursor-not-allowed": isPending },
                    )}
                    onClick={() => open()}
                  >
                    <SwitchCamera />
                  </div>
                )
              }}
            </BunnyUploadWidget>

            <div
              className={cn(
                "bg-accent hover:bg-accent/60 flex size-11 cursor-pointer items-center justify-center rounded-full text-white transition",
                { "cursor-not-allowed": isPending },
              )}
              onClick={isPending ? undefined : handleDeleteBanner}
            >
              <X />
            </div>
          </div>
        </AspectRatio>
      </div>

      <div className="absolute -bottom-[48px] left-5 max-sm:-bottom-[38px]">
        <BunnyUploadWidget
          userId={currentUser?._id!}
          fileName={`${currentUser?._id}/profile`}
          uploadType="image"
          onSuccess={handleUploadProfile}
        >
          {({ open }) => {
            return (
              <Avatar
                className={cn(
                  "border-accent relative size-36 cursor-pointer border-4 object-none object-center max-sm:size-24",
                  { "cursor-not-allowed": isPending },
                )}
                onClick={() => open()}
              >
                {currentUser?.image ? (
                  <AvatarImage
                    src={currentUser.image}
                    width={600}
                    height={600}
                    className="object-cover"
                    alt={currentUser?.name || "Profile image"}
                  />
                ) : (
                  <AvatarFallback>XO</AvatarFallback>
                )}

                <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity duration-300 hover:opacity-100">
                  <div className="bg-accent flex size-11 items-center justify-center rounded-full text-white">
                    <SwitchCamera />
                  </div>
                </div>
              </Avatar>
            )
          }}
        </BunnyUploadWidget>
      </div>
    </div>
  )
}
