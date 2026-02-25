"use client"

import { useEffect, useRef } from "react"
import { useBunnyPlayerControl } from "@/hooks"
import { cn } from "@/lib/utils"

interface BunnyVideoPlayerProps {
  src: string
  aspectRatio?: string
  className?: string
  threshold?: number
}

export const BunnyVideoPlayer: React.FC<BunnyVideoPlayerProps> = ({
  src,
  aspectRatio = "16 / 9",
  className,
  threshold = 0.3,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const { pause } = useBunnyPlayerControl({ iframeRef })

  // IntersectionObserver: pause when video leaves viewport
  useEffect(() => {
    if (!containerRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry.isIntersecting) {
          pause()
        }
      },
      { threshold }
    )

    observer.observe(containerRef.current)

    return () => observer.disconnect()
  }, [pause, threshold])

  // Build iframe URL with required parameters
  const buildIframeSrc = () => {
    const url = new URL(src)
    const hasAutoplay = url.searchParams.get("autoplay") === "true"
    // preload=false for lazy loading (skip if autoplay — needs preload to start)
    if (!url.searchParams.has("preload")) {
      url.searchParams.set("preload", hasAutoplay ? "true" : "false")
    }
    // responsive=true enables Player.js API
    if (!url.searchParams.has("responsive")) {
      url.searchParams.set("responsive", "true")
    }
    return url.toString()
  }

  const iframeSrc = buildIframeSrc()

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full overflow-hidden", className)}
      style={{ aspectRatio }}
    >
      <iframe
        ref={iframeRef}
        src={iframeSrc}
        loading="lazy"
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
        className="absolute inset-0 h-full w-full"
        allowFullScreen
        title="Lecteur vidéo"
      />
    </div>
  )
}
