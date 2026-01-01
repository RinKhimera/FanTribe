"use client"

import { motion } from "motion/react"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface ThumbnailStripProps {
  medias: string[]
  index: number
  onIndexChange?: (i: number) => void
}

const isVideo = (m: string) =>
  m.startsWith("https://iframe.mediadelivery.net/embed/")

export const ThumbnailStrip = ({
  medias,
  index,
  onIndexChange,
}: ThumbnailStripProps) => {
  const total = medias.length

  if (total <= 1) return null

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 400 }}
        className={cn(
          "absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-1.5 rounded-xl p-1.5",
          "bg-black/60 backdrop-blur-md border border-white/10",
          "shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
        )}
      >
        {medias.slice(0, 7).map((m, i) => (
          <motion.button
            key={m + i}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation()
              onIndexChange?.(i)
            }}
            className={cn(
              "relative size-9 sm:size-10 md:size-12 overflow-hidden rounded-lg transition-all duration-300",
              i === index
                ? "ring-2 ring-white ring-offset-1 ring-offset-black/80"
                : "opacity-50 hover:opacity-100 ring-1 ring-white/10"
            )}
          >
            {isVideo(m) ? (
              <div className="bg-black/60 flex h-full w-full items-center justify-center">
                <div
                  className={cn(
                    "flex size-5 sm:size-6 items-center justify-center rounded-full",
                    i === index ? "bg-white" : "bg-white/20"
                  )}
                >
                  <div
                    className={cn(
                      "ml-0.5 size-0 border-y-[3px] border-l-[5px] border-y-transparent",
                      i === index ? "border-l-black" : "border-l-white"
                    )}
                  />
                </div>
              </div>
            ) : (
              <Image
                src={m}
                alt={`Thumbnail ${i + 1}`}
                fill
                className="object-cover"
                sizes="48px"
              />
            )}
          </motion.button>
        ))}
        {total > 7 && (
          <div
            className={cn(
              "flex size-9 sm:size-10 md:size-12 items-center justify-center rounded-lg",
              "bg-white/20 border border-white/30"
            )}
          >
            <span className="text-xs font-semibold text-white">
              +{total - 7}
            </span>
          </div>
        )}
      </motion.div>

      {/* Gradient protection for bottom thumbnails */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/60 to-transparent" />
    </>
  )
}
