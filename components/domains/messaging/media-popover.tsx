"use client"

import { useMutation } from "convex/react"
import { motion } from "motion/react"
import { ImageIcon, Loader2 } from "lucide-react"
import { useRef, useState } from "react"
import { toast } from "sonner"
import { POST_CROP_PRESETS } from "@/components/shared/image-crop/aspect-ratio-presets"
import { ImageCropDialog } from "@/components/shared/image-crop/image-crop-dialog"
import { Button } from "@/components/ui/button"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { useCurrentUser } from "@/hooks/useCurrentUser"
import { logger } from "@/lib/config"
import { useBunnyUpload } from "@/hooks"
import { cn } from "@/lib/utils"

type MediaPopoverProps = {
  conversationId: Id<"conversations">
}

type CropState = {
  imageSrc: string
  file: File
} | null

export const MediaPopover = ({ conversationId }: MediaPopoverProps) => {
  const { currentUser } = useCurrentUser()
  const { uploadMedia } = useBunnyUpload()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [cropState, setCropState] = useState<CropState>(null)

  const sendMessage = useMutation(api.messaging.sendMessage)

  const handleFileSelect = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !currentUser) return

    if (fileInputRef.current) fileInputRef.current.value = ""

    if (!file.type.startsWith("image/")) {
      toast.error("Seules les images sont acceptées")
      return
    }

    const maxFileSize = 10 * 1024 * 1024
    if (file.size > maxFileSize) {
      toast.error("Le fichier est trop volumineux. Taille maximale: 10MB")
      return
    }

    const objectUrl = URL.createObjectURL(file)
    setCropState({ imageSrc: objectUrl, file })
  }

  const uploadAndSendImage = async (file: File) => {
    if (!currentUser) return
    setIsUploading(true)

    try {
      const fileExtension = file.name.split(".").pop() || "jpg"
      const randomSuffix = crypto
        .randomUUID()
        .replace(/-/g, "")
        .substring(0, 13)
      const fileName = `messages/${currentUser._id}/${randomSuffix}.${fileExtension}`

      const result = await uploadMedia({
        file,
        fileName,
        userId: currentUser._id,
      })

      if (!result.success) {
        throw new Error(result.error || "Upload échoué")
      }

      await sendMessage({
        conversationId,
        medias: [
          {
            type: "image",
            url: result.url,
            mediaId: result.mediaId,
            mimeType: file.type,
            fileName: file.name,
            fileSize: file.size,
          },
        ],
      })

      logger.success("Image envoyée avec succès", {
        conversationId,
        mediaId: result.mediaId,
      })
    } catch (error) {
      logger.error("Erreur lors de l'envoi de l'image", error, {
        conversationId,
        userId: currentUser._id,
      })
      toast.error("Une erreur s'est produite !", {
        description:
          "Le partage a échoué. Veuillez vérifier votre connexion internet et réessayer",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleMsgCropConfirm = async (croppedBlob: Blob) => {
    if (!cropState) return
    URL.revokeObjectURL(cropState.imageSrc)
    const croppedFile = new File([croppedBlob], cropState.file.name, {
      type: croppedBlob.type,
    })
    setCropState(null)
    await uploadAndSendImage(croppedFile)
  }

  const handleMsgCropSkip = async () => {
    if (!cropState) return
    const originalFile = cropState.file
    URL.revokeObjectURL(cropState.imageSrc)
    setCropState(null)
    await uploadAndSendImage(originalFile)
  }

  const handleMsgCropCancel = () => {
    if (cropState) URL.revokeObjectURL(cropState.imageSrc)
    setCropState(null)
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/*"
        aria-label="Choisir un fichier"
        onChange={handleFileChange}
        disabled={isUploading}
      />
      <Button
        variant="ghost"
        size="icon"
        aria-label="Ajouter une image"
        className={cn(
          "size-9 rounded-full transition-colors",
          isUploading
            ? "bg-amber-500/20 text-amber-500"
            : "text-muted-foreground hover:bg-white/10 hover:text-foreground"
        )}
        onClick={handleFileSelect}
        disabled={isUploading}
      >
        {isUploading ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Loader2 size={20} />
          </motion.div>
        ) : (
          <ImageIcon size={20} />
        )}
      </Button>

      {/* Crop Dialog */}
      {cropState && (
        <ImageCropDialog
          imageSrc={cropState.imageSrc}
          open={true}
          onOpenChange={(open) => {
            if (!open) handleMsgCropCancel()
          }}
          onConfirm={handleMsgCropConfirm}
          onCancel={handleMsgCropCancel}
          onSkip={handleMsgCropSkip}
          mode="queue"
          cropShape="rect"
          presets={POST_CROP_PRESETS}
          title="Recadrer l'image"
        />
      )}
    </>
  )
}
