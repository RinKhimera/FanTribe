"use client"

import { ImagePlus, LoaderCircle, Video } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type MediaMode = "empty" | "images" | "video"

interface MediaUploadButtonProps {
  mediaCount: number
  maxMedia: number
  mediaMode: MediaMode
  isPending: boolean
  isUploading: boolean
  onUploadClick: () => void
}

export const MediaUploadButton = ({
  mediaCount,
  maxMedia,
  mediaMode,
  isPending,
  isUploading,
  onUploadClick,
}: MediaUploadButtonProps) => {
  const isDisabled =
    isPending || isUploading || mediaMode === "video" || mediaCount >= maxMedia
  const isAtLimit = mediaMode === "video" || mediaCount >= maxMedia

  const label = isUploading
    ? "Envoi…"
    : mediaMode === "video"
      ? "1 vidéo max"
      : isAtLimit
        ? "Limite atteinte"
        : mediaMode === "images"
          ? `Image (${mediaCount}/${maxMedia})`
          : `Média (${mediaCount}/${maxMedia})`

  return (
    <Button
      type="button"
      variant="outline"
      className={cn(
        "rounded-full h-10 gap-2",
        "hover:bg-primary/10 hover:text-primary hover:border-primary/30",
        "transition-all duration-200",
        isDisabled && "opacity-50 cursor-not-allowed",
      )}
      onClick={onUploadClick}
      disabled={isDisabled}
    >
      {isUploading ? (
        <LoaderCircle className="size-4 animate-spin" />
      ) : mediaMode === "video" ? (
        <Video className="size-4" />
      ) : (
        <ImagePlus className="size-4" />
      )}
      <span className="hidden sm:inline">{label}</span>
    </Button>
  )
}
