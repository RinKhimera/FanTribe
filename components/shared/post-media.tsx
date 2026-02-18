"use client"

import Image from "next/image"
import React, { useEffect, useEffectEvent, useState } from "react"
import { MediaLightbox } from "@/components/shared/media-lightbox"
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { useVideoMetadata } from "@/hooks"
import { getOptimalDisplayRatio, getVideoDisplayInfo } from "@/lib/calculators/video-display-info"
import { cn } from "@/lib/utils"
import type { PostMedia as PostMediaType } from "@/types"
import { BunnyVideoPlayer } from "./bunny-video-player"
import { LockedContentOverlay } from "./post-media/locked-content-overlay"

interface PostMediaProps {
  medias: PostMediaType[]
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
    mediaUrls: medias.map((m) => m.url),
    enabled: !isMediaLocked && medias.length > 0,
  })

  const imageMedias = medias.filter((m) => m.type === "image")
  const imageSlides = imageMedias.map((m) => ({ src: m.url }))

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

  const openImage = (media: PostMediaType) => {
    const idx = imageMedias.indexOf(media)
    if (idx >= 0) {
      setViewerIndex(idx)
      setViewerOpen(true)
    }
  }

  const renderMedia = (
    media: PostMediaType,
    forceRatio?: string,
    isInCarousel?: boolean,
  ) => {
    if (media.type === "video") {
      // Obtenir les métadonnées de la vidéo et calculer l'aspect ratio optimal
      let optimalRatio = forceRatio || "16 / 9"

      if (media.mediaId && videoMetadata[media.mediaId]) {
        const videoData = videoMetadata[media.mediaId]
        const videoInfo = getVideoDisplayInfo(videoData)
        const calculatedRatio = getOptimalDisplayRatio(videoInfo)
        optimalRatio = forceRatio || calculatedRatio
      }

      return (
        <div
          key={media.url}
          onClick={(e) => e.stopPropagation()}
        >
          <BunnyVideoPlayer
            src={media.url}
            aspectRatio={optimalRatio}
            className={cn(!isInCarousel && "rounded-xl")}
          />
        </div>
      )
    }

    // Image rendering with modern design
    // In carousel: use blur background + object-contain (container has fixed 4:5 ratio)
    // Single media: use natural aspect ratio (no blur needed)
    if (isInCarousel) {
      return (
        <button
          type="button"
          key={media.url}
          onClick={(e) => {
            e.stopPropagation()
            openImage(media)
          }}
          className="group absolute inset-0 cursor-pointer overflow-hidden focus:outline-none"
          onContextMenu={(e) => e.preventDefault()}
        >
          {/* Blurred background - fills entire container */}
          <Image
            src={media.url}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 600px"
            className="scale-110 object-cover blur-lg"
            style={{ filter: "blur(20px)" }}
            draggable={false}
            onDragStart={(e) => e.preventDefault()}
            onContextMenu={(e) => e.preventDefault()}
          />
          {/* Main image - centered with object-contain to show complete image */}
          <Image
            src={media.url}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 600px"
            className="z-10 cursor-pointer object-contain select-none"
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

    // Single media: natural aspect ratio, no blur background needed
    return (
      <button
        type="button"
        key={media.url}
        onClick={(e) => {
          e.stopPropagation()
          openImage(media)
        }}
        className="group relative flex w-full cursor-pointer overflow-hidden rounded-xl focus:outline-none"
        onContextMenu={(e) => e.preventDefault()}
      >
        <Image
          src={media.url}
          alt=""
          width={0}
          height={0}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 600px"
          className="h-auto max-h-187.5 w-full cursor-pointer object-cover select-none"
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
            {medias.map((m) => (
              <CarouselItem key={m.url}>
                <div
                  className="relative w-full overflow-hidden bg-black"
                  style={{ aspectRatio: "4 / 5" }}
                >
                  {renderMedia(m, "4 / 5", true)}
                </div>
              </CarouselItem>
            ))}
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

        <MediaLightbox
          slides={imageSlides}
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
      <MediaLightbox
        slides={imageSlides}
        index={viewerIndex}
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
        onIndexChange={setViewerIndex}
      />
    </>
  )
}
