"use client"

import { useQuery } from "convex/react"
import { ImageIcon, Lock, Play, Video } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import Image from "next/image"
import { useCallback, useMemo, useState } from "react"
import { MediaLightbox } from "@/components/shared/media-lightbox"
import { VideoViewerDialog } from "@/components/shared/video-viewer-dialog"
import { api } from "@/convex/_generated/api"
import { Doc, Id } from "@/convex/_generated/dataModel"
import {
  containerVariants,
  masonryItemVariants,
  skeletonVariants,
} from "@/lib/animations"
import { cn } from "@/lib/utils"
import type { PostMedia } from "@/types"

// Masonry item heights for visual variety
const MASONRY_HEIGHTS = ["h-48", "h-64", "h-56", "h-72", "h-52", "h-60"]

const VideoThumbnail = ({
  thumbnailUrl,
}: {
  thumbnailUrl?: string
}) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)

  if (!thumbnailUrl || hasError) {
    return (
      <motion.div
        variants={skeletonVariants}
        initial="initial"
        animate="animate"
        className="bg-muted absolute inset-0 flex items-center justify-center"
      >
        <Video className="text-muted-foreground size-10" />
      </motion.div>
    )
  }

  return (
    <>
      {!isLoaded && (
        <motion.div
          variants={skeletonVariants}
          initial="initial"
          animate="animate"
          className="bg-muted absolute inset-0 flex items-center justify-center"
        >
          <Video className="text-muted-foreground size-8" />
        </motion.div>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={thumbnailUrl}
        alt="Aperçu vidéo"
        className={cn(
          "absolute inset-0 h-full w-full object-cover transition-opacity duration-500",
          isLoaded ? "opacity-100" : "opacity-0",
        )}
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
      />
    </>
  )
}

const GalleryItem = ({
  item,
  index,
  canViewMedia,
  isMediaProtected,
  onOpen,
}: {
  item: { _id: string; media: PostMedia; visibility: string }
  index: number
  canViewMedia: boolean
  isMediaProtected: boolean
  onOpen: () => void
}) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const mediaUrl = item.media.url
  const isVideo = item.media.type === "video"
  const heightClass = MASONRY_HEIGHTS[index % MASONRY_HEIGHTS.length]

  return (
    <motion.div
      variants={masonryItemVariants}
      className={cn(
        "group relative mb-3 overflow-hidden rounded-xl",
        heightClass,
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image/Video content */}
      <div
        className={cn(
          "relative h-full w-full cursor-pointer transition-[filter] duration-300",
          canViewMedia ? "group-hover:brightness-90" : "brightness-50",
        )}
        onClick={canViewMedia ? onOpen : undefined}
      >
        {canViewMedia ? (
          <>
            {isVideo ? (
              <div className="relative h-full w-full">
                <VideoThumbnail
                  thumbnailUrl={item.media.thumbnailUrl}
                />
                {/* Play button — matches Bunny Stream player style */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="flex size-12 items-center justify-center rounded-full bg-[#7C3AED] shadow-lg">
                    <Play className="ml-0.5 size-5.5 fill-white text-white" />
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Loading skeleton */}
                {!isLoaded && (
                  <motion.div
                    variants={skeletonVariants}
                    initial="initial"
                    animate="animate"
                    className="bg-muted absolute inset-0"
                  />
                )}
                <Image
                  src={mediaUrl}
                  alt="Media content"
                  fill
                  className={cn(
                    "object-cover transition-opacity duration-500",
                    isLoaded ? "opacity-100" : "opacity-0",
                  )}
                  sizes="(max-width: 640px) 50vw, 33vw"
                  onLoad={() => setIsLoaded(true)}
                />
              </>
            )}
          </>
        ) : (
          <div className="glass-card flex h-full w-full flex-col items-center justify-center gap-3 bg-black/40">
            <div className="bg-muted/30 flex size-16 items-center justify-center rounded-full backdrop-blur-sm">
              <Lock className="text-muted-foreground size-7" />
            </div>
            <span className="text-muted-foreground text-sm font-medium">
              Contenu réservé
            </span>
          </div>
        )}
      </div>

      {/* Hover overlay — images only (videos already have a permanent play button) */}
      <AnimatePresence>
        {isHovered && canViewMedia && !isVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
          >
            <div className="glass-button flex size-12 items-center justify-center rounded-full">
              <ImageIcon className="text-primary size-5" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Protected badge */}
      {isMediaProtected && (
        <div className="absolute top-2 right-2">
          <div className="glass-card flex items-center gap-1.5 rounded-full px-2.5 py-1">
            <Lock className="text-primary size-3" />
            <span className="text-xs font-medium">Abonnés</span>
          </div>
        </div>
      )}
    </motion.div>
  )
}

export const UserGallery = ({
  authorId,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  currentUser: _currentUser,
}: {
  authorId: Id<"users">
  currentUser: Doc<"users">
}) => {
  // Le backend filtre déjà les médias - seuls les médias accessibles sont retournés
  const userGallery = useQuery(api.posts.getUserGallery, { authorId })
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerIndex, setViewerIndex] = useState(0)
  const [videoDialogOpen, setVideoDialogOpen] = useState(false)
  const [activeVideo, setActiveVideo] = useState<PostMedia | null>(null)

  // Extraire les données pour une référence stable dans useMemo
  const galleryLength = userGallery?.length ?? 0

  // Le backend retourne uniquement les médias accessibles (slides for the lightbox — images only)
  const mediaSlides = useMemo(() => {
    if (!userGallery) return [] as { src: string }[]
    return userGallery
      .filter((item) => item.media.type === "image")
      .map((item) => ({ src: item.media.url }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [galleryLength])

  const openViewerAt = useCallback(
    (mediaUrl: string) => {
      const idx = mediaSlides.findIndex((s) => s.src === mediaUrl)
      if (idx === -1) return
      setViewerIndex(idx)
      setViewerOpen(true)
    },
    [mediaSlides],
  )

  const openVideoViewer = useCallback((media: PostMedia) => {
    setActiveVideo(media)
    setVideoDialogOpen(true)
  }, [])

  // Split items into columns for masonry layout
  const columns = (() => {
    if (!userGallery) return [[], [], []]
    const cols: (typeof userGallery)[] = [[], [], []]
    userGallery.forEach((item, index) => {
      cols[index % 3].push(item)
    })
    return cols
  })()

  if (!userGallery) {
    return (
      <div className="p-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <motion.div
              key={i}
              variants={skeletonVariants}
              initial="initial"
              animate="animate"
              className={cn(
                "bg-muted rounded-xl",
                MASONRY_HEIGHTS[i % MASONRY_HEIGHTS.length],
              )}
            />
          ))}
        </div>
      </div>
    )
  }

  if (userGallery.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-20"
      >
        <div className="glass-card mb-4 flex size-20 items-center justify-center rounded-2xl">
          <ImageIcon className="text-muted-foreground size-10" />
        </div>
        <h3 className="text-lg font-semibold">Aucun média</h3>
        <p className="text-muted-foreground mt-1 text-sm">
          Pas de médias pour le moment
        </p>
      </motion.div>
    )
  }

  return (
    <>
      {/* Masonry Grid - SECURITE: Tous les items retournés par le backend sont accessibles */}
      <motion.div
        variants={containerVariants}
        initial="initial"
        animate="animate"
        className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3"
      >
        {/* Column 1 */}
        <div className="flex flex-col">
          {columns[0].map((item, i) => (
            <GalleryItem
              key={item._id}
              item={item}
              index={i * 3}
              canViewMedia={true}
              isMediaProtected={item.visibility === "subscribers_only"}
              onOpen={() =>
                item.media.type === "video"
                  ? openVideoViewer(item.media)
                  : openViewerAt(item.media.url)
              }
            />
          ))}
        </div>

        {/* Column 2 */}
        <div className="flex flex-col">
          {columns[1].map((item, i) => (
            <GalleryItem
              key={item._id}
              item={item}
              index={i * 3 + 1}
              canViewMedia={true}
              isMediaProtected={item.visibility === "subscribers_only"}
              onOpen={() =>
                item.media.type === "video"
                  ? openVideoViewer(item.media)
                  : openViewerAt(item.media.url)
              }
            />
          ))}
        </div>

        {/* Column 3 - Hidden on mobile */}
        <div className="hidden flex-col sm:flex">
          {columns[2].map((item, i) => (
            <GalleryItem
              key={item._id}
              item={item}
              index={i * 3 + 2}
              canViewMedia={true}
              isMediaProtected={item.visibility === "subscribers_only"}
              onOpen={() =>
                item.media.type === "video"
                  ? openVideoViewer(item.media)
                  : openViewerAt(item.media.url)
              }
            />
          ))}
        </div>
      </motion.div>

      <MediaLightbox
        slides={mediaSlides}
        index={viewerIndex}
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
        onIndexChange={setViewerIndex}
      />

      <VideoViewerDialog
        open={videoDialogOpen}
        onOpenChange={setVideoDialogOpen}
        videoUrl={activeVideo?.url ?? null}
        width={activeVideo?.width}
        height={activeVideo?.height}
        thumbnailUrl={activeVideo?.thumbnailUrl}
      />
    </>
  )
}
