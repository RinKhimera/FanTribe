"use client"

import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import Image from "next/image"
import { useCallback, useEffect, useEffectEvent, useRef, useState } from "react"
import { fullscreenVariants } from "@/lib/animations"
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
  const [isMounted, setIsMounted] = useState<boolean>(open)
  const [, setIsClosing] = useState<boolean>(false)
  const ANIMATION_MS = 200

  const handleMountState = useEffectEvent(
    (mounted: boolean, closing: boolean) => {
      setIsMounted(mounted)
      setIsClosing(closing)
    },
  )

  useEffect(() => {
    if (open) {
      handleMountState(true, false)
      return
    }
    if (!open && isMounted) {
      handleMountState(isMounted, true)
      const t = setTimeout(() => {
        handleMountState(false, false)
      }, ANIMATION_MS)
      return () => clearTimeout(t)
    }
  }, [open, isMounted])

  useEffect(() => {
    if (!isMounted) return
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
  }, [isMounted])

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

  if (!isMounted) return null

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "fixed inset-0 z-[999] flex items-center justify-center select-none",
            className,
          )}
          role="dialog"
          aria-modal="true"
          onClick={onClose}
          onContextMenu={(e) => e.preventDefault()}
        >
          {/* Backdrop with blur */}
          <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" />

          {/* Close button - glass style */}
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 400 }}
            onClick={onClose}
            aria-label="Fermer"
            className={cn(
              "absolute top-4 right-4 z-10 flex size-12 items-center justify-center rounded-full",
              "bg-white/10 backdrop-blur-xl border border-white/20",
              "transition-all duration-300",
              "hover:scale-110 hover:bg-white/20",
            )}
          >
            <X className="size-5 text-white/90" />
          </motion.button>

          {/* Counter badge */}
          {total > 1 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, type: "spring", stiffness: 400 }}
              className={cn(
                "absolute top-4 left-1/2 z-10 -translate-x-1/2 rounded-full px-5 py-2.5",
                "bg-black/40 backdrop-blur-xl border border-white/20",
                "shadow-[0_4px_20px_rgba(0,0,0,0.3)]",
              )}
            >
              <span className="text-sm font-semibold tracking-wide">
                <span className="text-white">{index + 1}</span>
                <span className="text-white/50 mx-1.5">/</span>
                <span className="text-white/80">{total}</span>
              </span>
            </motion.div>
          )}

          {/* Navigation - Prev */}
          {total > 1 && (
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 400 }}
              onClick={(e) => {
                e.stopPropagation()
                go(-1)
              }}
              aria-label="Précédent"
              disabled={index === 0}
              className={cn(
                "absolute top-1/2 left-4 z-10 flex size-14 -translate-y-1/2 items-center justify-center rounded-full",
                "bg-white/10 backdrop-blur-xl border border-white/20",
                "transition-all duration-300",
                index === 0
                  ? "cursor-not-allowed opacity-30"
                  : "hover:scale-110 hover:bg-white/20",
              )}
            >
              <ChevronLeft className={cn(
                "size-7 transition-colors duration-300",
                index === 0 ? "text-white/50" : "text-white/90",
              )} />
            </motion.button>
          )}

          {/* Navigation - Next */}
          {total > 1 && (
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 400 }}
              onClick={(e) => {
                e.stopPropagation()
                go(1)
              }}
              aria-label="Suivant"
              disabled={index === total - 1}
              className={cn(
                "absolute top-1/2 right-4 z-10 flex size-14 -translate-y-1/2 items-center justify-center rounded-full",
                "bg-white/10 backdrop-blur-xl border border-white/20",
                "transition-all duration-300",
                index === total - 1
                  ? "cursor-not-allowed opacity-30"
                  : "hover:scale-110 hover:bg-white/20",
              )}
            >
              <ChevronRight className={cn(
                "size-7 transition-colors duration-300",
                index === total - 1 ? "text-white/50" : "text-white/90",
              )} />
            </motion.button>
          )}

          {/* Thumbnail strip at bottom */}
          {total > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 400 }}
              className={cn(
                "absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-2 rounded-2xl p-2.5",
                "bg-black/50 backdrop-blur-xl border border-white/10",
                "shadow-[0_8px_32px_rgba(0,0,0,0.4)]",
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
                    "relative size-14 overflow-hidden rounded-xl transition-all duration-300",
                    i === index
                      ? "ring-2 ring-white ring-offset-2 ring-offset-black/80"
                      : "opacity-50 hover:opacity-100 ring-1 ring-white/10",
                  )}
                >
                  {isVideo(m) ? (
                    <div className="bg-black/60 flex h-full w-full items-center justify-center">
                      <div className={cn(
                        "flex size-7 items-center justify-center rounded-full",
                        i === index
                          ? "bg-white"
                          : "bg-white/20",
                      )}>
                        <div className={cn(
                          "ml-0.5 size-0 border-y-4 border-l-6 border-y-transparent",
                          i === index
                            ? "border-l-black"
                            : "border-l-white",
                        )} />
                      </div>
                    </div>
                  ) : (
                    <Image
                      src={m}
                      alt={`Thumbnail ${i + 1}`}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  )}
                </motion.button>
              ))}
              {total > 7 && (
                <div className={cn(
                  "flex size-14 items-center justify-center rounded-xl",
                  "bg-white/20 border border-white/30",
                )}>
                  <span className="text-sm font-semibold text-white">
                    +{total - 7}
                  </span>
                </div>
              )}
            </motion.div>
          )}

          {/* Image container */}
          <motion.div
            variants={fullscreenVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="relative flex max-h-[80vh] w-full max-w-5xl items-center justify-center px-16"
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
                          "ring-1 ring-white/10 shadow-[0_25px_80px_-12px_rgba(0,0,0,0.6)]",
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
                          "max-h-[80vh] w-auto rounded-2xl object-contain select-none",
                          "ring-1 ring-white/10",
                          "shadow-[0_25px_80px_-12px_rgba(0,0,0,0.6)]",
                        )}
                        draggable={false}
                        onDragStart={(e) => e.preventDefault()}
                        onContextMenu={(e) => e.preventDefault()}
                        sizes="100vw"
                      />
                    )}
                  </motion.div>
                ) : null,
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
