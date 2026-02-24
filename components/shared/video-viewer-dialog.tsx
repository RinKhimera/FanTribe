"use client"

import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
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
}

export function VideoViewerDialog({
  open,
  onOpenChange,
  videoUrl,
}: VideoViewerDialogProps) {
  if (!videoUrl) return null

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
            "fixed top-[50%] left-[50%] z-50 w-full max-w-[calc(100vw-2rem)] translate-x-[-50%] translate-y-[-50%] sm:max-w-4xl",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "duration-200 focus:outline-none",
          )}
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

          <div className="overflow-hidden rounded-xl">
            <BunnyVideoPlayer
              src={autoplayUrl}
              aspectRatio="16 / 9"
              className="w-full"
            />
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </Dialog>
  )
}
