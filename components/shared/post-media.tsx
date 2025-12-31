"use client"

import { Lock, Sparkles } from "lucide-react"
import Image from "next/image"
import React, { useEffect, useMemo, useState } from "react"
import { extractVideoGuidFromUrl } from "@/app/api/bunny/helper/get-video"
import { FullscreenImageViewer } from "@/components/shared/fullscreen-image-viewer"
import { Button } from "@/components/ui/button"
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { getOptimalDisplayRatio, getVideoDisplayInfo } from "@/lib/calculators"
import { logger } from "@/lib/config"
import { cn } from "@/lib/utils"
import type { BunnyVideoGetResponse } from "@/types"

interface PostMediaProps {
  medias: string[]
  canView: boolean
  authorUsername?: string
  onRequireSubscribe: () => void
}

export const PostMedia: React.FC<PostMediaProps> = ({
  medias,
  canView,
  authorUsername,
  onRequireSubscribe,
}) => {
  const [carouselApi, setCarouselApi] = useState<CarouselApi>()
  const [currentSlide, setCurrentSlide] = useState(0)
  const [slideCount, setSlideCount] = useState(0)
  const [videoMetadata, setVideoMetadata] = useState<
    Record<string, BunnyVideoGetResponse>
  >({})
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerIndex, setViewerIndex] = useState(0)

  // Liste des seules images (exclut les vidéos)
  const imageMedias = useMemo(
    () =>
      medias.filter(
        (m) => !m.startsWith("https://iframe.mediadelivery.net/embed/"),
      ),
    [medias],
  )

  // Extract video GUIDs once and memoize them
  const videoGuids = useMemo(() => {
    return medias
      .filter((url) =>
        url.startsWith("https://iframe.mediadelivery.net/embed/"),
      )
      .map((url) => extractVideoGuidFromUrl(url))
      .filter((guid): guid is string => guid !== null)
  }, [medias])

  // Create a stable key from video GUIDs to prevent unnecessary refetches
  const videoGuidsKey = useMemo(() => videoGuids.join(","), [videoGuids])

  // Récupérer les métadonnées des vidéos au montage du composant
  useEffect(() => {
    const fetchVideoMetadata = async () => {
      if (!canView || videoGuids.length === 0) return

      try {
        // Appeler l'API route pour récupérer les métadonnées
        const response = await fetch("/api/bunny/metadata", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ videoGuids }),
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result = await response.json()

        if (result.success && result.data) {
          setVideoMetadata(result.data)
        } else {
          throw new Error("Invalid response from metadata API")
        }
      } catch (error) {
        logger.error(
          "Erreur lors de la récupération des métadonnées vidéos",
          error,
        )
      }
    }

    fetchVideoMetadata()
    // Use videoGuidsKey instead of medias to prevent refetching on every render
  }, [videoGuidsKey, canView, videoGuids])

  useEffect(() => {
    if (!carouselApi) return
    setSlideCount(carouselApi.scrollSnapList().length)
    setCurrentSlide(carouselApi.selectedScrollSnap())
    carouselApi.on("select", () =>
      setCurrentSlide(carouselApi.selectedScrollSnap()),
    )
  }, [carouselApi])

  if (!medias || medias.length === 0) return null

  // Detect if first media is an image (for artistic blur preview)
  const firstMedia = medias[0]
  const isFirstMediaImage =
    firstMedia && !firstMedia.startsWith("https://iframe.mediadelivery.net/embed/")

  // Locked content view - Premium artistic blur design
  if (!canView) {
    return (
      <div
        className={cn(
          "relative mt-3 w-full overflow-hidden rounded-2xl",
          "aspect-video",
        )}
      >
        {/* Artistic blurred preview of actual image */}
        {isFirstMediaImage && (
          <Image
            src={firstMedia}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, 600px"
            className="blur-artistic object-cover"
            draggable={false}
          />
        )}

        {/* Fallback gradient if no image */}
        {!isFirstMediaImage && (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/30 to-primary/40 opacity-40" />
        )}

        {/* Premium overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />

        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]">
          <div
            className="h-full w-full"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>

        {/* Content card */}
        <div className="relative z-10 flex h-full flex-col items-center justify-center px-6">
          <div className="glass-premium p-8 text-center max-w-sm">
            {/* Lock icon */}
            <div
              className={cn(
                "mx-auto mb-5 flex size-16 items-center justify-center rounded-full",
                "bg-primary",
              )}
            >
              <Lock className="size-7 text-primary-foreground" />
            </div>

            {/* Title */}
            <h3 className="mb-2 text-xl font-bold tracking-tight text-foreground">
              Contenu Exclusif
            </h3>

            <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
              Ce contenu est réservé aux abonnés de{" "}
              <span className="font-semibold text-primary">
                @{authorUsername}
              </span>
            </p>

            <Button
              size="lg"
              className={cn(
                "rounded-full px-8 h-11",
                "font-semibold tracking-wide",
              )}
              onClick={(e) => {
                e.stopPropagation()
                onRequireSubscribe()
              }}
            >
              <Sparkles className="mr-2 size-4" />
              S&apos;abonner
            </Button>
          </div>
        </div>
      </div>
    )
  }

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
          className={cn(
            "relative w-full overflow-hidden",
            !isInCarousel && "mt-3 rounded-xl",
          )}
          style={{ aspectRatio: optimalRatio }}
        >
          <iframe
            src={`${media}${media.includes("?") ? "&" : "?"}preload=false`}
            loading="lazy"
            allow="accelerometer; gyroscope; encrypted-media; picture-in-picture;"
            className="absolute inset-0 h-full w-full"
            allowFullScreen
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
          !isInCarousel && "mt-3 rounded-xl",
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
            "relative z-10 h-auto max-h-[750px] w-full cursor-pointer object-cover select-none",
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
        className="relative mt-3 overflow-hidden rounded-xl"
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
              "bg-black/40 backdrop-blur-sm border-0",
              "hover:bg-black/60",
              "transition-all duration-200",
            )}
          />
          <CarouselNext
            variant="secondary"
            size="icon"
            className={cn(
              "right-2 size-8 rounded-full",
              "bg-black/40 backdrop-blur-sm border-0",
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
