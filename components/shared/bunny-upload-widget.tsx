"use client"

import { useRef, useState } from "react"
import { toast } from "sonner"
import { logger } from "@/lib/config"
import { useBunnyUpload } from "@/hooks"

interface BunnyUploadWidgetProps {
  onSuccess: (result: {
    url: string
    mediaId: string
    type: "image" | "video"
  }) => void
  onError?: (error: string) => void
  fileName: string
  maxFileSize?: number // en bytes
  children: ({ open }: { open: () => void }) => React.ReactNode
  userId: string
  uploadType?: "image" | "video" | "both"
}

export const BunnyUploadWidget = ({
  onSuccess,
  onError,
  fileName,
  maxFileSize = 10 * 1024 * 1024, // 10MB par défaut
  children,
  userId,
  uploadType = "image",
}: BunnyUploadWidgetProps) => {
  const { uploadMedia } = useBunnyUpload()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleFileSelect = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validation de la taille
    if (file.size > maxFileSize) {
      const maxSizeMB = (maxFileSize / (1024 * 1024)).toFixed(1)
      const errorMsg = `Le fichier est trop volumineux. Taille maximale: ${maxSizeMB}MB`
      toast.error(errorMsg)
      onError?.(errorMsg)
      return
    }

    // Validation du type de fichier
    const isImage = file.type.startsWith("image/")
    const isVideo = file.type.startsWith("video/")

    if (uploadType === "image" && !isImage) {
      const errorMsg = "Seules les images sont acceptées"
      toast.error(errorMsg)
      onError?.(errorMsg)
      return
    }

    if (uploadType === "video" && !isVideo) {
      const errorMsg = "Seules les vidéos sont acceptées"
      toast.error(errorMsg)
      onError?.(errorMsg)
      return
    }

    if (uploadType === "both" && !isImage && !isVideo) {
      const errorMsg = "Seules les images et vidéos sont acceptées"
      toast.error(errorMsg)
      onError?.(errorMsg)
      return
    }

    setIsUploading(true)

    try {
      const fileExtension = file.name.split(".").pop()
      const randomSuffix = crypto
        .randomUUID()
        .replace(/-/g, "")
        .substring(0, 13)
      const finalFileName = `${fileName}_${randomSuffix}.${fileExtension}`

      const result = await uploadMedia({
        file,
        fileName: finalFileName,
        userId,
      })

      if (!result.success) {
        throw new Error(result.error || "Upload échoué")
      }

      onSuccess({
        url: result.url,
        mediaId: result.mediaId,
        type: result.type,
      })

      toast.success("Fichier uploadé avec succès")
    } catch (error) {
      logger.error("Erreur upload fichier", error, { fileName, userId })
      const errorMsg = "Erreur lors de l'upload du fichier"
      toast.error(errorMsg)
      onError?.(errorMsg)
    } finally {
      setIsUploading(false)
      // Reset le input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const getAcceptAttribute = () => {
    if (uploadType === "image") return "image/*"
    if (uploadType === "video") return "video/*"
    return "image/*,video/*"
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept={getAcceptAttribute()}
        onChange={handleFileChange}
        disabled={isUploading}
      />

      <div className={isUploading ? "pointer-events-none opacity-50" : ""}>
        {children({
          open: isUploading ? () => {} : handleFileSelect,
        })}
      </div>

      {isUploading && (
        <div className="text-muted-foreground mt-2 flex items-center gap-2 text-sm">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Upload en cours...
        </div>
      )}
    </>
  )
}
