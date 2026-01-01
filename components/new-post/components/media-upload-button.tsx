"use client"

import { ImagePlus, LoaderCircle } from "lucide-react"
import { forwardRef } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface MediaUploadButtonProps {
  mediaCount: number
  maxMedia: number
  isPending: boolean
  isUploading: boolean
  onUploadClick: () => void
}

export const MediaUploadButton = forwardRef<
  HTMLInputElement,
  MediaUploadButtonProps
>(({ mediaCount, maxMedia, isPending, isUploading, onUploadClick }, ref) => {
  const isDisabled = isPending || isUploading || mediaCount >= maxMedia
  const isAtLimit = mediaCount >= maxMedia

  return (
    <>
      <input
        ref={ref}
        type="file"
        multiple
        accept="image/*,video/*"
        className="hidden"
      />

      <Button
        type="button"
        variant="outline"
        className={cn(
          "rounded-full h-10 gap-2",
          "hover:bg-primary/10 hover:text-primary hover:border-primary/30",
          "transition-all duration-200",
          isDisabled && "opacity-50 cursor-not-allowed"
        )}
        onClick={onUploadClick}
        disabled={isDisabled}
      >
        {isUploading ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : (
          <ImagePlus className="size-4" />
        )}
        <span className="hidden sm:inline">
          {isUploading
            ? "Upload..."
            : isAtLimit
              ? "Limite atteinte"
              : `Média (${mediaCount}/${maxMedia})`}
        </span>
      </Button>
    </>
  )
})

MediaUploadButton.displayName = "MediaUploadButton"
