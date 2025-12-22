"use client"

import { useMutation } from "convex/react"
import { ImageIcon, Loader2 } from "lucide-react"
import { useRef, useState } from "react"
import { toast } from "sonner"
import { api } from "@/convex/_generated/api"
import { useCurrentUser } from "@/hooks/useCurrentUser"
import { logger } from "@/lib/config"
import { uploadBunnyAsset } from "@/lib/services/bunny"
import { ConversationProps } from "@/types"

export const MediaPopover = ({
  conversation,
}: {
  conversation: ConversationProps
}) => {
  const { currentUser } = useCurrentUser()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)

  const sendImage = useMutation(api.messages.sendImage)

  const handleFileSelect = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0]
    if (!file || !currentUser || !conversation) return

    // Validation du type de fichier (images seulement pour les messages)
    if (!file.type.startsWith("image/")) {
      toast.error("Seules les images sont acceptées")
      return
    }

    // Validation de la taille (10MB max)
    const maxFileSize = 10 * 1024 * 1024
    if (file.size > maxFileSize) {
      toast.error("Le fichier est trop volumineux. Taille maximale: 10MB")
      return
    }

    setIsUploading(true)

    try {
      const fileExtension = file.name.split(".").pop()
      const randomSuffix = crypto
        .randomUUID()
        .replace(/-/g, "")
        .substring(0, 13)
      const fileName = `${currentUser._id}/${randomSuffix}.${fileExtension}`

      const result = await uploadBunnyAsset({
        file,
        fileName,
        userId: currentUser._id,
      })

      if (!result.success) {
        throw new Error(result.error || "Upload échoué")
      }

      await sendImage({
        conversation: conversation._id,
        imgUrl: result.url,
        sender: currentUser._id,
      })

      logger.success("Image envoyée avec succès", {
        conversationId: conversation._id,
        mediaId: result.mediaId,
      })
    } catch (error) {
      logger.error("Erreur lors de l'envoi de l'image", error, {
        conversationId: conversation._id,
        userId: currentUser._id,
      })
      toast.error("Une erreur s'est produite !", {
        description:
          "Le partage a échoué. Veuillez vérifier votre connexion internet et réessayer",
      })
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
        disabled={isUploading}
      />
      <button
        className="flex items-center p-2"
        onClick={handleFileSelect}
        disabled={isUploading}
      >
        {isUploading ? (
          <Loader2 size={22} className="text-muted-foreground animate-spin" />
        ) : (
          <ImageIcon
            size={22}
            className="text-muted-foreground transition hover:text-white"
          />
        )}
      </button>
    </>
  )
}
