"use client"

import { AnimatePresence, motion } from "motion/react"
import { useCallback, useEffect, useEffectEvent, useState } from "react"
import {
  ThumbnailStrip,
  ViewerControls,
  ViewerMedia,
} from "./fullscreen-viewer"
import { useScrollLock } from "@/hooks"
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
  const [isMounted, setIsMounted] = useState<boolean>(open)
  const [, setIsClosing] = useState<boolean>(false)
  const ANIMATION_MS = 200

  // Use the scroll lock hook
  useScrollLock({ enabled: isMounted })

  const handleMountState = useEffectEvent(
    (mounted: boolean, closing: boolean) => {
      setIsMounted(mounted)
      setIsClosing(closing)
    }
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

  const total = medias.length

  const go = useCallback(
    (dir: 1 | -1) => {
      if (!open) return
      if (dir === -1 && index === 0) return
      if (dir === 1 && index === total - 1) return
      const next = index + dir
      onIndexChange?.(next)
    },
    [index, total, open, onIndexChange]
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
            className
          )}
          role="dialog"
          aria-modal="true"
          onClick={onClose}
          onContextMenu={(e) => e.preventDefault()}
        >
          {/* Backdrop with blur */}
          <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" />

          <ViewerControls
            index={index}
            total={total}
            onClose={onClose}
            onNavigate={go}
          />

          <ThumbnailStrip
            medias={medias}
            index={index}
            onIndexChange={onIndexChange}
          />

          <ViewerMedia
            medias={medias}
            index={index}
            total={total}
            onClose={onClose}
            onNavigate={go}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
