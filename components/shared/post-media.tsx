"use client"

import Image from "next/image"
import React, { useEffect, useEffectEvent, useMemo, useState } from "react"
import { FullscreenImageViewer } from "@/components/shared/fullscreen-image-viewer"
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { useVideoMetadata } from "@/hooks"
import { getOptimalDisplayRatio, getVideoDisplayInfo } from "@/lib/calculators"
import { cn } from "@/lib/utils"
import { BunnyVideoPlayer } from "./bunny-video-player"
import { LockedContentOverlay } from "./post-media/locked-content-overlay"

interface PostMediaProps {
  medias: string[]
  isMediaLocked?: boolean
  mediaCount?: number
  authorUsername?: string
  onRequireSubscribe: () => void
}

export const PostMedia: React.FC<PostMediaProps> = ({
  medias,
  isMediaLocked = false,
  mediaCount = 0,
  authorUsername,
  onRequireSubscribe,
}) => {
  const [carouselApi, setCarouselApi] = useState<CarouselApi>()
  const [currentSlide, setCurrentSlide] = useState(0)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerIndex, setViewerIndex] = useState(0)

  // Use the centralized video metadata hook - only when content is not locked
  const { metadata: videoMetadata } = useVideoMetadata({
    mediaUrls: medias,
    enabled: !isMediaLocked && medias.length > 0,
  })

  // Liste des seules images (exclut les vidéos)
  const imageMedias = useMemo(
    () =>
      medias.filter(
        (m) => !m.startsWith("https://iframe.mediadelivery.net/embed/"),
      ),
    [medias],
  )

  // Compute slideCount from API instead of storing in state
  const slideCount = carouselApi?.scrollSnapList().length ?? 0

  // Use useEffectEvent to avoid calling setState synchronously in effect
  const syncCurrentSlide = useEffectEvent(() => {
    if (carouselApi) {
      setCurrentSlide(carouselApi.selectedScrollSnap())
    }
  })

  useEffect(() => {
    if (!carouselApi) return

    syncCurrentSlide()

    carouselApi.on("select", syncCurrentSlide)
    carouselApi.on("reInit", syncCurrentSlide)

    return () => {
      carouselApi.off("select", syncCurrentSlide)
      carouselApi.off("reInit", syncCurrentSlide)
    }
  }, [carouselApi])

  // Si le contenu est verrouillé, afficher l'overlay sans URL
  // Le backend retourne medias=[] quand isMediaLocked=true
  if (isMediaLocked) {
    return (
      <LockedContentOverlay
        mediaCount={mediaCount}
        authorUsername={authorUsername}
        onRequireSubscribe={onRequireSubscribe}
      />
    )
  }

  if (!medias || medias.length === 0) return null

  const openImage = (media: string) => {
    const idx = imageMedias.indexOf(media)
    if (idx >= 0) {
      setViewerIndex(idx)
      setViewerOpen(true)
    }
  }

  const renderMedia = (
    media: string,
    forceRatio?: string,
    isInCarousel?: boolean,
  ) => {
    const isVideo = media.startsWith("https://iframe.mediadelivery.net/embed/")

    if (isVideo) {
      // Extraire le GUID de l'URL de la vidéo
      const guidMatch = media.match(/\/embed\/\d+\/([^?/]+)/)
      const videoGuid = guidMatch ? guidMatch[1] : null

      // Obtenir les métadonnées de la vidéo et calculer l'aspect ratio optimal
      let optimalRatio = forceRatio || "16 / 9"

      if (videoGuid && videoMetadata[videoGuid]) {
        const videoData = videoMetadata[videoGuid]
        const videoInfo = getVideoDisplayInfo(videoData)
        const calculatedRatio = getOptimalDisplayRatio(videoInfo)
        optimalRatio = forceRatio || calculatedRatio
      }

      return (
        <div
          key={media}
          onClick={(e) => e.stopPropagation()}
        >
          <BunnyVideoPlayer
            src={media}
            aspectRatio={optimalRatio}
            className={cn(!isInCarousel && "rounded-xl")}
          />
        </div>
      )
    }

    // Image rendering with modern design
    return (
      <button
        type="button"
        key={media}
        onClick={(e) => {
          e.stopPropagation()
          openImage(media)
        }}
        className={cn(
          "group relative flex w-full cursor-pointer overflow-hidden focus:outline-none",
          !isInCarousel && "rounded-xl",
        )}
        onContextMenu={(e) => e.preventDefault()}
      >
        {/* Blurred background */}
        <Image
          src={media}
          alt=""
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 600px"
          className="scale-110 object-cover blur-lg"
          style={{ filter: "blur(20px)" }}
          draggable={false}
          onDragStart={(e) => e.preventDefault()}
          onContextMenu={(e) => e.preventDefault()}
        />
        {/* Main image */}
        <Image
          src={media}
          alt=""
          width={0}
          height={0}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 600px"
          className={cn(
            "relative z-10 h-auto max-h-187.5 w-full cursor-pointer object-cover select-none",
          )}
          draggable={false}
          onDragStart={(e) => e.preventDefault()}
          onContextMenu={(e) => e.preventDefault()}
        />
        {/* Hover overlay */}
        <div
          className={cn(
            "absolute inset-0 z-20 bg-black/0 transition-colors duration-300",
            "group-hover:bg-black/10",
          )}
        />
      </button>
    )
  }

  // Multiple media: carousel with modern design
  if (medias.length > 1) {
    return (
      <div
        className="relative overflow-hidden rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <Carousel setApi={setCarouselApi}>
          <CarouselContent>
            {medias.map((m) => {
              const isVideo = m.startsWith(
                "https://iframe.mediadelivery.net/embed/",
              )

              // Pour les vidéos dans le carousel, calculer l'aspect ratio optimal
              let carouselRatio = "16 / 9"
              if (isVideo) {
                const guidMatch = m.match(/\/embed\/\d+\/([^?/]+)/)
                const videoGuid = guidMatch ? guidMatch[1] : null

                if (videoGuid && videoMetadata[videoGuid]) {
                  const videoData = videoMetadata[videoGuid]
                  const videoInfo = getVideoDisplayInfo(videoData)
                  carouselRatio = getOptimalDisplayRatio(videoInfo)
                }
              }

              return (
                <CarouselItem key={m}>
                  {isVideo ? (
                    <div
                      className="relative w-full overflow-hidden"
                      style={{ aspectRatio: carouselRatio }}
                    >
                      {renderMedia(m, carouselRatio, true)}
                    </div>
                  ) : (
                    <div className="relative w-full overflow-hidden">
                      {renderMedia(m, undefined, true)}
                    </div>
                  )}
                </CarouselItem>
              )
            })}
          </CarouselContent>

          {/* Navigation buttons - subtle rounded style */}
          <CarouselPrevious
            variant="secondary"
            size="icon"
            className={cn(
              "left-2 size-8 rounded-full",
              "border-0 bg-black/40 backdrop-blur-sm",
              "hover:bg-black/60",
              "transition-all duration-200",
            )}
          />
          <CarouselNext
            variant="secondary"
            size="icon"
            className={cn(
              "right-2 size-8 rounded-full",
              "border-0 bg-black/40 backdrop-blur-sm",
              "hover:bg-black/60",
              "transition-all duration-200",
            )}
          />
        </Carousel>

        {/* Slide indicator - Minimal style */}
        {slideCount > 1 && (
          <div className="absolute bottom-2 left-1/2 z-10 -translate-x-1/2">
            <div
              className={cn(
                "flex items-center gap-1 rounded-full px-2 py-1",
                "bg-black/50 backdrop-blur-sm",
                "text-[10px] font-medium text-white",
              )}
            >
              <span className="tabular-nums">{currentSlide + 1}</span>
              <span className="opacity-60">/</span>
              <span className="tabular-nums opacity-80">{slideCount}</span>
            </div>
          </div>
        )}

        <FullscreenImageViewer
          medias={imageMedias}
          index={viewerIndex}
          open={viewerOpen}
          onClose={() => setViewerOpen(false)}
          onIndexChange={setViewerIndex}
        />
      </div>
    )
  }

  // Single media
  return (
    <>
      {medias.map((m) => renderMedia(m))}
      <FullscreenImageViewer
        medias={imageMedias}
        index={viewerIndex}
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
        onIndexChange={setViewerIndex}
      />
    </>
  )
}
