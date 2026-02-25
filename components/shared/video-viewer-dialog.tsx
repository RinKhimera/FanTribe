"use client"

import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { useEffect, useState } from "react"
import { BunnyVideoPlayer } from "@/components/shared/bunny-video-player/bunny-video-player"
import {
  Dialog,
  DialogClose,
  DialogOverlay,
  DialogTitle,
} from "@/components/ui/dialog"
import { VisuallyHidden } from "@/components/ui/visually-hidden"
import { cn } from "@/lib/utils"

interface VideoViewerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  videoUrl: string | null
  width?: number
  height?: number
  thumbnailUrl?: string
}

/** Detect aspect ratio from thumbnail image (Bunny thumbnails preserve video ratio) */
function useThumbnailAspectRatio(
  thumbnailUrl: string | undefined,
  open: boolean,
) {
  const [loaded, setLoaded] = useState<{
    url: string
    ratio: number
  } | null>(null)

  useEffect(() => {
    if (!open || !thumbnailUrl) return
    const img = new window.Image()
    img.onload = () => {
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        setLoaded({ url: thumbnailUrl, ratio: img.naturalWidth / img.naturalHeight })
      }
    }
    img.src = thumbnailUrl
    return () => {
      img.onload = null
    }
  }, [thumbnailUrl, open])

  // Only return ratio if it matches the current thumbnail
  if (!thumbnailUrl || loaded?.url !== thumbnailUrl) return null
  return loaded.ratio
}

export function VideoViewerDialog({
  open,
  onOpenChange,
  videoUrl,
  width,
  height,
  thumbnailUrl,
}: VideoViewerDialogProps) {
  const thumbnailRatio = useThumbnailAspectRatio(thumbnailUrl, open)

  if (!videoUrl) return null

  // Determine aspect ratio: stored dimensions > thumbnail detection > 16:9 fallback
  const aspectRatio =
    width && height
      ? width / height
      : thumbnailRatio ?? 16 / 9

  const isPortrait = aspectRatio < 1

  // Append autoplay=true to the Bunny embed URL
  const autoplayUrl = (() => {
    try {
      const url = new URL(videoUrl)
      url.searchParams.set("autoplay", "true")
      return url.toString()
    } catch {
      return videoUrl
    }
  })()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogOverlay className="bg-black/90" />
        <DialogPrimitive.Content
          className={cn(
            "fixed top-[50%] left-[50%] z-50 translate-x-[-50%] translate-y-[-50%]",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "duration-200 focus:outline-none",
            isPortrait
              ? "h-[85vh] w-auto max-w-[calc(100vw-2rem)]"
              : "w-full max-w-[calc(100vw-2rem)] sm:max-w-4xl",
          )}
          style={isPortrait ? { aspectRatio: `${aspectRatio}` } : undefined}
        >
          <VisuallyHidden>
            <DialogTitle>Lecteur vidéo</DialogTitle>
          </VisuallyHidden>

          <DialogClose
            className={cn(
              "absolute -top-10 right-0 z-50",
              "flex size-8 items-center justify-center rounded-full",
              "bg-white/10 text-white backdrop-blur-sm",
              "transition-colors hover:bg-white/20",
              "focus:ring-2 focus:ring-white/50 focus:outline-none",
            )}
            aria-label="Fermer la vidéo"
          >
            <X className="size-5" />
          </DialogClose>

          <div className="h-full overflow-hidden rounded-xl">
            <BunnyVideoPlayer
              src={autoplayUrl}
              aspectRatio={`${aspectRatio}`}
              className="h-full w-full"
            />
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </Dialog>
  )
}
