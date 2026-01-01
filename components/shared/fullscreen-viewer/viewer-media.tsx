"use client"

import { AnimatePresence, motion } from "motion/react"
import Image from "next/image"
import { useRef } from "react"
import { fullscreenVariants } from "@/lib/animations"
import { cn } from "@/lib/utils"

interface ViewerMediaProps {
  medias: string[]
  index: number
  total: number
  onClose: () => void
  onNavigate: (dir: 1 | -1) => void
}

const isVideo = (m: string) =>
  m.startsWith("https://iframe.mediadelivery.net/embed/")

export const ViewerMedia = ({
  medias,
  index,
  total,
  onClose,
  onNavigate,
}: ViewerMediaProps) => {
  const startY = useRef<number | null>(null)
  const startX = useRef<number | null>(null)

  return (
    <motion.div
      variants={fullscreenVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="relative flex h-full w-full items-center justify-center px-4 sm:px-8 md:px-16"
      onClick={(e) => e.stopPropagation()}
      onTouchStart={(e) => {
        const t = e.touches[0]
        startY.current = t.clientY
        startX.current = t.clientX
      }}
      onTouchEnd={(e) => {
        if (startY.current == null || startX.current == null) return
        const t = e.changedTouches[0]
        const dy = t.clientY - startY.current
        const dx = t.clientX - startX.current
        if (Math.abs(dy) > 60 && Math.abs(dy) > Math.abs(dx)) {
          onClose()
        } else if (
          Math.abs(dx) > 60 &&
          Math.abs(dx) > Math.abs(dy) &&
          total > 1
        ) {
          onNavigate(dx < 0 ? 1 : -1)
        }
        startY.current = null
        startX.current = null
      }}
    >
      <AnimatePresence mode="wait">
        {medias.map((m, i) =>
          i === index ? (
            <motion.div
              key={m + i}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="flex items-center justify-center"
            >
              {isVideo(m) ? (
                <div
                  className={cn(
                    "relative w-full max-w-5xl overflow-hidden rounded-2xl",
                    "ring-1 ring-white/10 shadow-[0_25px_80px_-12px_rgba(0,0,0,0.6)]"
                  )}
                  style={{ aspectRatio: "16 / 9" }}
                >
                  <iframe
                    src={`${m}${m.includes("?") ? "&" : "?"}preload=false`}
                    allow="accelerometer; gyroscope; encrypted-media; picture-in-picture;"
                    className="absolute inset-0 h-full w-full"
                    allowFullScreen
                  />
                </div>
              ) : (
                <Image
                  src={m}
                  alt="media"
                  width={1600}
                  height={1200}
                  priority
                  className={cn(
                    "max-h-[calc(100vh-100px)] sm:max-h-[calc(100vh-120px)] w-auto max-w-full rounded-xl object-contain select-none",
                    "ring-1 ring-white/10",
                    "shadow-[0_25px_80px_-12px_rgba(0,0,0,0.6)]"
                  )}
                  draggable={false}
                  onDragStart={(e) => e.preventDefault()}
                  onContextMenu={(e) => e.preventDefault()}
                  sizes="100vw"
                />
              )}
            </motion.div>
          ) : null
        )}
      </AnimatePresence>
    </motion.div>
  )
}
