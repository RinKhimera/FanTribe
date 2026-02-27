"use client"

import { useMutation } from "convex/react"
import { motion } from "motion/react"
import { Camera, Loader2, Trash2, Upload } from "lucide-react"
import Image from "next/image"
import { useEffect, useRef, useState, useTransition } from "react"
import { toast } from "sonner"
import {
  AVATAR_ASPECT,
  BANNER_ASPECT,
} from "@/components/shared/image-crop/aspect-ratio-presets"
import { ImageCropDialog } from "@/components/shared/image-crop/image-crop-dialog"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { api } from "@/convex/_generated/api"
import { imageLoadVariants } from "@/lib/animations"
import { logger } from "@/lib/config/logger"
import { useBunnyUpload } from "@/hooks"
import { cn } from "@/lib/utils"
import { UserProps } from "@/types"

type CropDialogState = {
  imageSrc: string
  file: File
  context: "avatar" | "banner"
} | null

type OptimisticPreview = {
  context: "avatar" | "banner"
  url: string
} | null

export const UpdateImages = ({ currentUser }: { currentUser: UserProps }) => {
  const [isPending, startTransition] = useTransition()
  const { deleteMedia, uploadMedia } = useBunnyUpload()
  const updateProfileImage = useMutation(api.users.updateProfileImage)
  const updateBannerImage = useMutation(api.users.updateBannerImage)

  const [cropDialogState, setCropDialogState] = useState<CropDialogState>(null)
  const [optimisticPreview, setOptimisticPreview] =
    useState<OptimisticPreview>(null)

  const avatarInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)

  // Clear optimistic preview when Convex data updates with the new CDN URL
  const prevImageRef = useRef(currentUser?.image)
  const prevBannerRef = useRef(currentUser?.imageBanner)

  useEffect(() => {
    if (
      optimisticPreview?.context === "avatar" &&
      currentUser?.image !== prevImageRef.current
    ) {
      URL.revokeObjectURL(optimisticPreview.url)
      setOptimisticPreview(null)
    }
    if (
      optimisticPreview?.context === "banner" &&
      currentUser?.imageBanner !== prevBannerRef.current
    ) {
      URL.revokeObjectURL(optimisticPreview.url)
      setOptimisticPreview(null)
    }
    prevImageRef.current = currentUser?.image
    prevBannerRef.current = currentUser?.imageBanner
  }, [currentUser?.image, currentUser?.imageBanner, optimisticPreview])

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

  const handleFileSelect = (
    event: React.ChangeEvent<HTMLInputElement>,
    context: "avatar" | "banner"
  ) => {
    const file = event.target.files?.[0]
    if (!file) return
    event.target.value = ""

    if (!file.type.startsWith("image/")) {
      toast.error("Seules les images sont acceptées")
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Le fichier est trop volumineux. Taille maximale : 10 Mo")
      return
    }

    const objectUrl = URL.createObjectURL(file)
    setCropDialogState({ imageSrc: objectUrl, file, context })
  }

  const handleCropConfirm = async (croppedBlob: Blob) => {
    if (!cropDialogState || !currentUser) return
    const { context, file } = cropDialogState

    // Show optimistic preview
    const previewUrl = URL.createObjectURL(croppedBlob)
    setOptimisticPreview({ context, url: previewUrl })

    // Cleanup crop dialog
    URL.revokeObjectURL(cropDialogState.imageSrc)
    setCropDialogState(null)

    // Convert Blob to File
    const croppedFile = new File([croppedBlob], file.name, {
      type: croppedBlob.type,
    })

    startTransition(async () => {
      try {
        const fileExtension = file.name.split(".").pop() || "jpg"
        const randomSuffix = crypto
          .randomUUID()
          .replace(/-/g, "")
          .substring(0, 13)
        const fileName = `${currentUser._id}/${context}_${randomSuffix}.${fileExtension}`

        const result = await uploadMedia({
          file: croppedFile,
          fileName,
          userId: currentUser._id as string,
        })

        if (!result.success) throw new Error(result.error || "Upload échoué")

        if (context === "avatar") {
          // Delete old avatar from Bunny
          if (
            currentUser.image &&
            !currentUser.image.includes("placeholder.jpg") &&
            currentUser.image.includes("cdn.fantribe.io")
          ) {
            const oldMediaId = extractMediaIdFromUrl(currentUser.image)
            if (oldMediaId) {
              try {
                await deleteMedia({ mediaId: oldMediaId, type: "image" })
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
          })
          toast.success("Photo de profil mise à jour")
        } else {
          // Delete old banner from Bunny
          if (
            currentUser.imageBanner &&
            !currentUser.imageBanner.includes("placeholder.jpg") &&
            currentUser.imageBanner.includes("cdn.fantribe.io")
          ) {
            const oldMediaId = extractMediaIdFromUrl(currentUser.imageBanner)
            if (oldMediaId) {
              try {
                await deleteMedia({ mediaId: oldMediaId, type: "image" })
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
          })
          toast.success("Bannière mise à jour")
        }
      } catch (error) {
        // Revert optimistic preview on failure (use previewUrl directly — optimisticPreview is stale in this closure)
        URL.revokeObjectURL(previewUrl)
        setOptimisticPreview(null)
        logger.error(`Failed to update ${context} image`, error)
        toast.error("Une erreur s'est produite !", {
          description:
            "Veuillez vérifier votre connexion internet et réessayer",
        })
      }
    })
  }

  const handleCropCancel = () => {
    if (cropDialogState) {
      URL.revokeObjectURL(cropDialogState.imageSrc)
    }
    setCropDialogState(null)
  }

  const handleDeleteBanner = () => {
    startTransition(async () => {
      try {
        await updateBannerImage({
          bannerUrl: "https://cdn.fantribe.io/fantribe/placeholder.jpg",
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

  // Determine displayed images (optimistic or actual)
  const displayedAvatar =
    optimisticPreview?.context === "avatar"
      ? optimisticPreview.url
      : currentUser?.image
  const displayedBanner =
    optimisticPreview?.context === "banner"
      ? optimisticPreview.url
      : currentUser?.imageBanner ||
        "https://cdn.fantribe.io/fantribe/placeholder.jpg"

  return (
    <div>
      {/* Hidden file inputs */}
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        aria-label="Choisir un fichier"
        onChange={(e) => handleFileSelect(e, "avatar")}
      />
      <input
        ref={bannerInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        aria-label="Choisir un fichier"
        onChange={(e) => handleFileSelect(e, "banner")}
      />

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
              src={displayedBanner}
              alt={currentUser?.name as string}
              className="object-cover"
              fill
              unoptimized={optimisticPreview?.context === "banner"}
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
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => bannerInputRef.current?.click()}
                  className="flex size-12 cursor-pointer items-center justify-center rounded-full bg-white/20 text-white transition-colors hover:bg-white/30"
                  aria-label="Changer la bannière"
                >
                  <Upload className="size-5" />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleDeleteBanner}
                  className="hover:bg-destructive/80 flex size-12 cursor-pointer items-center justify-center rounded-full bg-white/20 text-white transition-colors"
                  aria-label="Supprimer la bannière"
                >
                  <Trash2 className="size-5" />
                </motion.button>
              </>
            )}
          </motion.div>
        </AspectRatio>

        {/* Always-visible banner edit badge — hides on hover (full overlay takes over) and during upload */}
        <button
          type="button"
          onClick={() => !isPending && bannerInputRef.current?.click()}
          className={cn(
            "absolute bottom-2 right-2 flex cursor-pointer items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs text-white backdrop-blur-sm transition-opacity hover:bg-black/80 group-hover:opacity-0",
            { "opacity-0": isPending }
          )}
        >
          <Camera className="size-3.5" />
          <span>Modifier</span>
        </button>
      </div>

      {/* Avatar - positioned to overlap banner */}
      <div className="-mt-14 mb-4 px-4 sm:-mt-16 sm:px-6">
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
            onClick={() => !isPending && avatarInputRef.current?.click()}
          >
            {displayedAvatar ? (
              <AvatarImage
                src={displayedAvatar}
                className="object-cover"
                alt={currentUser?.name || "Profile image"}
              />
            ) : (
              <AvatarFallback className="bg-muted text-3xl">
                {currentUser?.name?.charAt(0) || "?"}
              </AvatarFallback>
            )}
          </Avatar>

          {/* Avatar hover overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-black/60 opacity-0 transition-opacity group-hover:opacity-100"
            onClick={() => !isPending && avatarInputRef.current?.click()}
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

          {/* Always-visible camera badge */}
          <div
            className={cn(
              "absolute bottom-1 right-1 flex size-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-opacity group-hover:opacity-0 sm:size-9",
              { "opacity-0": isPending }
            )}
          >
            <Camera className="size-4" />
          </div>
        </motion.div>
      </div>

      {/* Crop Dialog */}
      {cropDialogState && (
        <ImageCropDialog
          imageSrc={cropDialogState.imageSrc}
          open={true}
          onOpenChange={(open) => {
            if (!open) handleCropCancel()
          }}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
          cropShape={cropDialogState.context === "avatar" ? "round" : "rect"}
          aspectRatio={
            cropDialogState.context === "avatar"
              ? AVATAR_ASPECT
              : BANNER_ASPECT
          }
          title={
            cropDialogState.context === "avatar"
              ? "Recadrer la photo de profil"
              : "Recadrer la bannière"
          }
        />
      )}
    </div>
  )
}
