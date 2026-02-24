"use client"

import { ImagePlus, LoaderCircle, Video } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
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

  const tooltipText = isUploading
    ? "Envoi en cours…"
    : mediaMode === "video"
      ? "1 vidéo max"
      : isAtLimit
        ? "Limite atteinte"
        : mediaMode === "images"
          ? `Ajouter une image (${mediaCount}/${maxMedia})`
          : `Ajouter un média (${mediaCount}/${maxMedia})`

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="relative">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
              "size-9 rounded-full",
              "text-muted-foreground",
              "hover:bg-primary/10 hover:text-primary",
              "transition-colors duration-200",
              isDisabled && "opacity-50 cursor-not-allowed",
            )}
            onClick={onUploadClick}
            disabled={isDisabled}
            aria-label={tooltipText}
          >
            {isUploading ? (
              <LoaderCircle className="size-5 animate-spin" />
            ) : mediaMode === "video" ? (
              <Video className="size-5" />
            ) : (
              <ImagePlus className="size-5" />
            )}
          </Button>

          {/* Count badge */}
          {mediaCount > 0 && (
            <Badge
              variant={isAtLimit ? "destructive" : "default"}
              className={cn(
                "absolute -top-1 -right-1",
                "flex size-4.5 items-center justify-center",
                "rounded-full border-none p-0",
                "text-[10px] font-bold",
              )}
            >
              {mediaCount}
            </Badge>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={8}>
        <p>{tooltipText}</p>
      </TooltipContent>
    </Tooltip>
  )
}
