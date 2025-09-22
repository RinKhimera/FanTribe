"use client"

import { Image as ImageIcon, Lock } from "lucide-react"
import Image from "next/image"
import React, { useEffect, useState } from "react"
import { extractVideoGuidFromUrl } from "@/app/api/bunny/helper/get-video"
import { Button } from "@/components/ui/button"
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { getOptimalDisplayRatio, getVideoDisplayInfo } from "@/lib/video-utils"
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
        console.error(
          "❌ Erreur lors de la récupération des métadonnées vidéos:",
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

  if (!canView) {
    return (
      <div className="bg-muted/20 mt-2 flex aspect-video w-full flex-col items-center justify-center p-6">
        <div className="bg-background/90 mb-3 rounded-full p-3">
          <Lock className="text-primary size-6" />
        </div>
        <h3 className="mb-1 text-lg font-semibold">Contenu exclusif</h3>
        <p className="text-muted-foreground mb-4 text-center text-sm">
          Ce contenu est réservé aux abonnés de @{authorUsername}
        </p>
        <Button
          variant="default"
          size="sm"
          className="rounded-full"
          onClick={(e) => {
            e.stopPropagation()
            onRequireSubscribe()
          }}
        >
          S&apos;abonner pour voir
        </Button>
      </div>
    )
  }

  const renderMedia = (media: string, forceRatio?: string) => {
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
          className="relative mt-2 w-full overflow-hidden"
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

    return (
      <div
        key={media}
        onClick={(e) => e.stopPropagation()}
        className="relative mt-2 flex w-full overflow-hidden"
      >
        {/* Background blurred image */}
        <Image
          src={media}
          alt=""
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 600px"
          className="scale-110 object-cover blur-lg"
          style={{ filter: "blur(20px)" }}
        />
        {/* Main image */}
        <Image
          src={media}
          alt=""
          width={0}
          height={0}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 600px"
          className="relative z-10 h-auto max-h-[750px] w-full bg-red-50 object-cover"
        />
      </div>
    )
  }

  // Multiple media: carousel
  if (medias.length > 1) {
    return (
      <div className="relative mt-2" onClick={(e) => e.stopPropagation()}>
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
                      {renderMedia(m, carouselRatio)}
                    </div>
                  ) : (
                    <div className="relative w-full overflow-hidden">
                      {renderMedia(m)}
                    </div>
                  )}
                </CarouselItem>
              )
            })}
          </CarouselContent>
          <CarouselPrevious
            variant="secondary"
            size="icon"
            className="hover:bg-muted/30 left-2 bg-transparent"
          />
          <CarouselNext
            variant="secondary"
            size="icon"
            className="hover:bg-muted/30 right-2 bg-transparent"
          />
        </Carousel>
        {slideCount > 1 && (
          <div className="absolute bottom-1 left-1/2 z-10 -translate-x-1/2 transform">
            <div className="bg-muted/40 flex cursor-default items-center gap-1 rounded px-2 py-1 text-xs font-medium">
              <ImageIcon size={12} />
              {currentSlide + 1}/{slideCount}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Single media
  return <>{medias.map((m) => renderMedia(m))}</>
}
