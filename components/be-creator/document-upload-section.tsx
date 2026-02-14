"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { DocumentPreview } from "./document-preview"
import { CameraCapture } from "@/components/shared/camera-capture"
import { useBunnyUpload } from "@/hooks"
import { logger } from "@/lib/config"
import { Camera, IdCard, Upload, X } from "lucide-react"
import type { UploadedDocument } from "./types"

interface DocumentUploadSectionProps {
  type: "identityCard" | "selfie"
  uploadedDocument?: UploadedDocument
  onUploadSuccess: (result: {
    url: string
    mediaId: string
    type: "image" | "video"
  }) => void
  onRemove: () => void
  userId: string
  facingMode: "user" | "environment"
}

export const DocumentUploadSection = ({
  type,
  uploadedDocument,
  onUploadSuccess,
  onRemove,
  userId,
  facingMode,
}: DocumentUploadSectionProps) => {
  const { uploadMedia } = useBunnyUpload()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const uploadFile = async (file: File) => {
    setIsUploading(true)

    try {
      const fileExtension = file.name.split(".").pop() || "jpg"
      const randomSuffix = crypto
        .randomUUID()
        .replace(/-/g, "")
        .substring(0, 13)
      const documentType = type === "identityCard" ? "identity-card" : "selfie"
      const fileName = `creatorApplications/${userId}/${documentType}_${randomSuffix}.${fileExtension}`

      const result = await uploadMedia({
        file,
        fileName,
        userId,
      })

      if (!result.success) {
        throw new Error(result.error || "Upload échoué")
      }

      onUploadSuccess({
        url: result.url,
        mediaId: result.mediaId,
        type: result.type,
      })

      toast.success("Document uploadé avec succès")
    } catch (error) {
      logger.error("Erreur upload document", error, { type, userId })
      toast.error("Erreur lors de l'upload du document")
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }

    // Validation taille
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Le fichier est trop volumineux. Taille maximale : 10 Mo")
      return
    }

    // Validation type
    if (!file.type.startsWith("image/")) {
      toast.error("Seules les images sont acceptées")
      return
    }

    await uploadFile(file)
  }

  const handleCameraCapture = async (file: File) => {
    await uploadFile(file)
  }

  // État 1 : Document uploadé → Aperçu
  if (uploadedDocument) {
    return (
      <>
        <DocumentPreview
          url={uploadedDocument.url}
          onRemove={onRemove}
          onViewFullscreen={() => setPreviewUrl(uploadedDocument.url)}
        />

        {/* Fullscreen Dialog */}
        <Dialog
          open={previewUrl !== null}
          onOpenChange={(open) => {
            if (!open) setPreviewUrl(null)
          }}
        >
          <DialogContent className="flex max-h-[90vh] max-w-[90vw] items-center justify-center border-none bg-black/90 p-0 backdrop-blur-xl">
            <DialogTitle className="sr-only">Aperçu du document</DialogTitle>
            <DialogClose asChild>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-3 right-3 z-10 text-white hover:bg-white/20"
                aria-label="Fermer l'aperçu"
              >
                <X className="size-5" />
              </Button>
            </DialogClose>
            {previewUrl && (
              <Image
                src={previewUrl}
                alt="Aperçu du document"
                width={1200}
                height={900}
                className="max-h-[85vh] w-auto rounded object-contain"
              />
            )}
          </DialogContent>
        </Dialog>
      </>
    )
  }

  // État 2 : Upload en cours → Spinner uniquement
  if (isUploading) {
    return (
      <div className="flex items-center justify-center gap-2 py-4">
        <div className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="text-sm text-muted-foreground">Upload en cours…</span>
      </div>
    )
  }

  // État 3 : Vide → Icône + Boutons
  return (
    <>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Icon + Buttons */}
      <div className="flex flex-col items-center gap-4">
        {type === "identityCard" ? (
          <IdCard className="text-muted-foreground size-8" />
        ) : (
          <Camera className="text-muted-foreground size-8" />
        )}

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="mr-2 size-4" />
            Uploader
          </Button>

          <CameraCapture facingMode={facingMode} onCapture={handleCameraCapture}>
            {({ open }) => (
              <Button type="button" variant="outline" size="sm" onClick={open}>
                <Camera className="mr-2 size-4" />
                {type === "identityCard"
                  ? "Prendre une photo"
                  : "Prendre un selfie"}
              </Button>
            )}
          </CameraCapture>
        </div>
      </div>
    </>
  )
}
