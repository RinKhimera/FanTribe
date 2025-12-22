"use client"

import { Image as ImageIcon, Lock, Sparkles } from "lucide-react"
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

  // Récupérer les métadonnées des vidéos au montage du composant
  useEffect(() => {
    const fetchVideoMetadata = async () => {
      if (!canView || !medias || medias.length === 0) return

      // Filtrer les vidéos et extraire les GUIDs
      const videoGuids = medias
        .filter((url) =>
          url.startsWith("https://iframe.mediadelivery.net/embed/"),
        )
        .map((url) => extractVideoGuidFromUrl(url))
        .filter((guid): guid is string => guid !== null)

      if (videoGuids.length === 0) return

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
  }, [medias, canView])

  useEffect(() => {
    if (!carouselApi) return
    setSlideCount(carouselApi.scrollSnapList().length)
    setCurrentSlide(carouselApi.selectedScrollSnap())
    carouselApi.on("select", () =>
      setCurrentSlide(carouselApi.selectedScrollSnap()),
    )
  }, [carouselApi])

  if (!medias || medias.length === 0) return null

  // Locked content view - Modern design
  if (!canView) {
    return (
      <div
        className={cn(
          "relative mt-3 flex aspect-video w-full flex-col items-center justify-center",
          "overflow-hidden rounded-xl",
          "from-muted/40 to-muted/60 bg-linear-to-b",
          "backdrop-blur-sm",
        )}
      >
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="h-full w-full"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center px-6 text-center">
          <div
            className={cn(
              "mb-4 rounded-full p-4",
              "bg-background/80 shadow-lg backdrop-blur-sm",
              "ring-primary/20 ring-2",
            )}
          >
            <Lock className="text-primary size-8" />
          </div>

          <h3 className="mb-2 text-lg font-semibold tracking-tight">
            Contenu exclusif
          </h3>

          <p className="text-muted-foreground mb-5 max-w-xs text-sm">
            Ce contenu est réservé aux abonnés de{" "}
            <span className="text-primary font-medium">@{authorUsername}</span>
          </p>

          <Button
            variant="default"
            size="lg"
            className={cn(
              "rounded-full px-6 font-semibold",
              "shadow-primary/20 shadow-lg",
              "transition-all duration-200",
              "hover:shadow-primary/30 hover:scale-105 hover:shadow-xl",
            )}
            onClick={(e) => {
              e.stopPropagation()
              onRequireSubscribe()
            }}
          >
            <Sparkles className="mr-2 size-4" />
            S&apos;abonner pour voir
          </Button>
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
          "group relative flex w-full overflow-hidden focus:outline-none",
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

          {/* Navigation buttons with modern style */}
          <CarouselPrevious
            variant="secondary"
            size="icon"
            className={cn(
              "left-3 size-9",
              "bg-background/80 backdrop-blur-sm",
              "hover:bg-background/90",
              "border-0 shadow-lg",
            )}
          />
          <CarouselNext
            variant="secondary"
            size="icon"
            className={cn(
              "right-3 size-9",
              "bg-background/80 backdrop-blur-sm",
              "hover:bg-background/90",
              "border-0 shadow-lg",
            )}
          />
        </Carousel>

        {/* Slide indicator - Modern pill style */}
        {slideCount > 1 && (
          <div className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2">
            <div
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5",
                "bg-background/80 backdrop-blur-sm",
                "text-xs font-medium shadow-lg",
              )}
            >
              <ImageIcon size={12} className="text-muted-foreground" />
              <span className="tabular-nums">
                {currentSlide + 1}/{slideCount}
              </span>
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
