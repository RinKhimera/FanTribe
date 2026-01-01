"use client"

import { CircleX } from "lucide-react"
import { motion } from "motion/react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface MediaItem {
  url: string
  publicId: string
  type: "image" | "video"
}

interface MediaPreviewGridProps {
  medias: MediaItem[]
  onRemove: (index: number) => void
}

export const MediaPreviewGrid = ({
  medias,
  onRemove,
}: MediaPreviewGridProps) => {
  if (medias.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mt-4 grid grid-cols-2 gap-3"
    >
      {medias.map((media, index) => (
        <motion.div
          key={media.publicId}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="group relative overflow-hidden rounded-xl"
        >
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className={cn(
              "absolute top-2 right-2 z-10 size-8",
              "bg-black/60 hover:bg-black/80",
              "opacity-0 group-hover:opacity-100",
              "transition-opacity duration-200"
            )}
            onClick={() => onRemove(index)}
          >
            <CircleX className="size-5 text-white" />
          </Button>

          {media.type === "video" ? (
            <div className="aspect-video w-full rounded-xl overflow-hidden bg-muted">
              <iframe
                src={media.url}
                loading="lazy"
                className="w-full h-full"
                allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;"
                allowFullScreen
              />
            </div>
          ) : (
            <Image
              src={media.url}
              alt=""
              width={500}
              height={300}
              className="aspect-video w-full rounded-xl object-cover"
            />
          )}
        </motion.div>
      ))}
    </motion.div>
  )
}
