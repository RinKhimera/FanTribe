"use client"

import { ChevronLeft, ChevronRight, X } from "lucide-react"
import Image from "next/image"
import { useCallback, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

interface FullscreenImageViewerProps {
  medias: string[] // images ou iframes bunny
  index: number
  open: boolean
  onClose: () => void
  onIndexChange?: (i: number) => void
  className?: string
}

export const FullscreenImageViewer = ({
  medias,
  index,
  open,
  onClose,
  onIndexChange,
  className,
}: FullscreenImageViewerProps) => {
  const startY = useRef<number | null>(null)
  const startX = useRef<number | null>(null)

  useEffect(() => {
    if (!open) return
    const originalOverflow = document.body.style.overflow
    const originalPaddingRight = document.body.style.paddingRight

    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`
    }
    document.body.style.overflow = "hidden"

    const prevent = (e: Event) => {
      e.preventDefault()
    }

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
    }

    const onKey = (e: KeyboardEvent) => {
      const keysToBlock = [
        "ArrowUp",
        "ArrowDown",
        "PageUp",
        "PageDown",
        "Home",
        "End",
        "Space",
      ]
      if (keysToBlock.includes(e.key)) {
        e.preventDefault()
      }
    }

    window.addEventListener("wheel", onWheel, { passive: false })
    window.addEventListener("touchmove", prevent, { passive: false })
    window.addEventListener("keydown", onKey, { passive: false })

    return () => {
      document.body.style.overflow = originalOverflow
      document.body.style.paddingRight = originalPaddingRight
      window.removeEventListener("wheel", onWheel)
      window.removeEventListener("touchmove", prevent)
      window.removeEventListener("keydown", onKey)
    }
  }, [open])

  const total = medias.length

  const isVideo = (m: string) =>
    m.startsWith("https://iframe.mediadelivery.net/embed/")

  const go = useCallback(
    (dir: 1 | -1) => {
      if (!open) return
      if (dir === -1 && index === 0) return
      if (dir === 1 && index === total - 1) return
      const next = index + dir
      onIndexChange?.(next)
    },
    [index, total, open, onIndexChange],
  )

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowRight" && index < total - 1) go(1)
      if (e.key === "ArrowLeft" && index > 0) go(-1)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, go, onClose, index, total])

  if (!open) return null

  return (
    <div
      className={cn(
        "fixed inset-0 z-[999] flex items-center justify-center bg-black/90 backdrop-blur-sm select-none",
        className,
      )}
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        aria-label="Fermer"
        className="text-muted-foreground/70 focus-visible:ring-ring absolute top-4 right-4 rounded p-2 transition outline-none hover:text-white"
      >
        <X className="size-6" />
      </button>

      {total > 1 && (
        <div className="bg-muted/10 text-muted-foreground absolute top-4 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs/none font-medium backdrop-blur">
          {index + 1}/{total}
        </div>
      )}

      {/* Prev */}
      {total > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            go(-1)
          }}
          aria-label="Précédent"
          disabled={index === 0}
          className={cn(
            "text-muted-foreground/60 focus-visible:ring-ring absolute top-1/2 left-2 -translate-y-1/2 rounded p-3 transition outline-none",
            index === 0
              ? "cursor-default opacity-30"
              : "cursor-pointer hover:text-white",
          )}
        >
          <ChevronLeft className="size-7" />
        </button>
      )}

      {/* Next */}
      {total > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            go(1)
          }}
          aria-label="Suivant"
          disabled={index === total - 1}
          className={cn(
            "text-muted-foreground/60 focus-visible:ring-ring absolute top-1/2 right-2 -translate-y-1/2 rounded p-3 transition outline-none",
            index === total - 1
              ? "cursor-default opacity-30"
              : "cursor-pointer hover:text-white",
          )}
        >
          <ChevronRight className="size-7" />
        </button>
      )}

      {/* Image container */}
      <div
        className="relative flex max-h-[90vh] w-full max-w-5xl items-center justify-center"
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
            go(dx < 0 ? 1 : -1)
          }
          startY.current = null
          startX.current = null
        }}
      >
        {medias.map((m, i) => (
          <div
            key={m + i}
            className={cn(
              "absolute inset-0 flex items-center justify-center transition-opacity duration-300",
              i === index ? "opacity-100" : "pointer-events-none opacity-0",
            )}
          >
            {isVideo(m) ? (
              <div
                className="relative w-full max-w-5xl"
                style={{ aspectRatio: "16 / 9" }}
              >
                <iframe
                  src={`${m}${m.includes("?") ? "&" : "?"}preload=false`}
                  allow="accelerometer; gyroscope; encrypted-media; picture-in-picture;"
                  className="absolute inset-0 h-full w-full rounded"
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
                className="max-h-[90vh] w-auto rounded object-contain shadow-lg"
                sizes="100vw"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
