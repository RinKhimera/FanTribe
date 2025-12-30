"use client"

import { useMutation } from "convex/react"
import { motion } from "motion/react"
import { Camera, Loader2, Trash2, Upload } from "lucide-react"
import Image from "next/image"
import { useTransition } from "react"
import { toast } from "sonner"
import { BunnyUploadWidget } from "@/components/shared/bunny-upload-widget"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { api } from "@/convex/_generated/api"
import { imageLoadVariants } from "@/lib/animations"
import { logger } from "@/lib/config/logger"
import { deleteBunnyAsset } from "@/lib/services/bunny"
import { cn } from "@/lib/utils"
import { UserProps } from "@/types"

export const UpdateImages = ({ currentUser }: { currentUser: UserProps }) => {
  const [isPending, startTransition] = useTransition()
  const updateProfileImage = useMutation(api.users.updateProfileImage)
  const updateBannerImage = useMutation(api.users.updateBannerImage)

  const extractMediaIdFromUrl = (url: string): string | null => {
    try {
      const urlParts = url.split("/")
      const domainIndex = urlParts.findIndex((part) =>
        part.includes("cdn.fantribe.io")
      )
      if (domainIndex !== -1 && urlParts.length > domainIndex + 1) {
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
              logger.warn(
                "Impossible de supprimer l'ancienne image de profil",
                { error, oldMediaId }
              )
            }
          }
        }

        await updateProfileImage({
          imgUrl: result.url,
          tokenIdentifier: currentUser?.tokenIdentifier || "",
        })
        toast.success("Photo de profil mise à jour")
      } catch (error) {
        logger.error("Failed to update profile image", error)
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
              logger.warn("Impossible de supprimer l'ancienne bannière", {
                error,
                oldMediaId,
              })
            }
          }
        }

        await updateBannerImage({
          bannerUrl: result.url,
          tokenIdentifier: currentUser?.tokenIdentifier || "",
        })
        toast.success("Bannière mise à jour")
      } catch (error) {
        logger.error("Failed to update banner image", error)
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
          tokenIdentifier: currentUser?.tokenIdentifier || "",
        })
        toast.success("Votre photo de bannière a été supprimée")
      } catch (error) {
        logger.error("Failed to delete banner image", error)
        toast.error("Une erreur s'est produite !", {
          description:
            "Veuillez vérifier votre connexion internet et réessayer",
        })
      }
    })
  }

  return (
    <div>
      {/* Banner */}
      <div className="group relative">
        <AspectRatio ratio={3 / 1} className="bg-muted">
          <motion.div
            variants={imageLoadVariants}
            initial="initial"
            animate="animate"
            className="relative h-full w-full"
          >
            <Image
              src={
                currentUser?.imageBanner ||
                "https://cdn.fantribe.io/fantribe/placeholder.jpg"
              }
              alt={currentUser?.name as string}
              className="object-cover"
              fill
            />
          </motion.div>

          {/* Hover overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center gap-4 bg-black/60 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100"
          >
            {isPending ? (
              <div className="flex size-12 items-center justify-center rounded-full bg-white/20">
                <Loader2 className="size-6 animate-spin text-white" />
              </div>
            ) : (
              <>
                <BunnyUploadWidget
                  userId={(currentUser?._id as string) || ""}
                  fileName={`${currentUser?._id}/banner`}
                  uploadType="image"
                  onSuccess={handleUploadBanner}
                >
                  {({ open }) => (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => open()}
                      className="flex size-12 items-center justify-center rounded-full bg-white/20 text-white transition-colors hover:bg-white/30"
                    >
                      <Upload className="size-5" />
                    </motion.button>
                  )}
                </BunnyUploadWidget>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleDeleteBanner}
                  className="hover:bg-destructive/80 flex size-12 items-center justify-center rounded-full bg-white/20 text-white transition-colors"
                >
                  <Trash2 className="size-5" />
                </motion.button>
              </>
            )}
          </motion.div>
        </AspectRatio>

        {/* Upload hint */}
        <div className="text-muted-foreground pointer-events-none absolute bottom-2 right-2 flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1 text-xs opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
          <Camera className="size-3" />
          <span>Cliquez pour modifier</span>
        </div>
      </div>

      {/* Avatar - positioned to overlap banner */}
      <div className="-mt-14 mb-4 px-4 sm:-mt-16 sm:px-6">
        <BunnyUploadWidget
          userId={(currentUser?._id as string) || ""}
          fileName={`${currentUser?._id}/profile`}
          uploadType="image"
          onSuccess={handleUploadProfile}
        >
          {({ open }) => (
            <motion.div
              variants={imageLoadVariants}
              initial="initial"
              animate="animate"
              whileHover={{ scale: 1.05 }}
              className="group relative inline-block"
            >
              <Avatar
                className={cn(
                  "ring-background size-28 cursor-pointer ring-4 transition-shadow hover:shadow-xl sm:size-32",
                  { "pointer-events-none opacity-50": isPending }
                )}
                onClick={() => !isPending && open()}
              >
                {currentUser?.image ? (
                  <AvatarImage
                    src={currentUser.image}
                    className="object-cover"
                    alt={currentUser?.name || "Profile image"}
                  />
                ) : (
                  <AvatarFallback className="bg-muted text-3xl">
                    {currentUser?.name?.charAt(0) || "?"}
                  </AvatarFallback>
                )}
              </Avatar>

              {/* Avatar overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-black/60 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={() => !isPending && open()}
              >
                {isPending ? (
                  <Loader2 className="size-8 animate-spin text-white" />
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <Camera className="size-6 text-white" />
                    <span className="text-xs text-white">Modifier</span>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </BunnyUploadWidget>
      </div>
    </div>
  )
}
