"use client"

import { useQuery } from "convex/react"
import { AnimatePresence, motion } from "motion/react"
import { ImageIcon, Lock, Play } from "lucide-react"
import Image from "next/image"
import { useCallback, useMemo, useState } from "react"
import { FullscreenImageViewer } from "@/components/shared/fullscreen-image-viewer"
import { api } from "@/convex/_generated/api"
import { Doc, Id } from "@/convex/_generated/dataModel"
import { containerVariants, masonryItemVariants, skeletonVariants } from "@/lib/animations"
import { cn } from "@/lib/utils"

// Masonry item heights for visual variety
const MASONRY_HEIGHTS = ["h-48", "h-64", "h-56", "h-72", "h-52", "h-60"]

const GalleryItem = ({
  item,
  index,
  canViewMedia,
  isMediaProtected,
  onOpen,
}: {
  item: { _id: string; mediaUrl: string; visibility: string }
  index: number
  canViewMedia: boolean
  isMediaProtected: boolean
  onOpen: () => void
}) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const mediaUrl = item.mediaUrl
  const isVideo = mediaUrl.startsWith("https://iframe.mediadelivery.net/embed/")
  const heightClass = MASONRY_HEIGHTS[index % MASONRY_HEIGHTS.length]

  return (
    <motion.div
      variants={masonryItemVariants}
      className={cn(
        "group relative mb-3 overflow-hidden rounded-xl",
        heightClass
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image/Video content */}
      <div
        className={cn(
          "relative h-full w-full cursor-pointer transition-all duration-300",
          canViewMedia ? "group-hover:brightness-90" : "brightness-50"
        )}
        onClick={canViewMedia ? onOpen : undefined}
      >
        {canViewMedia ? (
          <>
            {/* Loading skeleton */}
            {!isLoaded && !isVideo && (
              <motion.div
                variants={skeletonVariants}
                initial="initial"
                animate="animate"
                className="bg-muted absolute inset-0"
              />
            )}

            {isVideo ? (
              <div className="bg-muted/30 relative flex h-full w-full items-center justify-center">
                <div className="glass-card absolute inset-0 flex items-center justify-center">
                  <div className="bg-primary/20 flex size-16 items-center justify-center rounded-full backdrop-blur-sm">
                    <Play className="text-primary ml-1 size-8 fill-current" />
                  </div>
                </div>
                <iframe
                  src={`${mediaUrl}${mediaUrl.includes("?") ? "&" : "?"}preload=false`}
                  allow="accelerometer; gyroscope; encrypted-media; picture-in-picture;"
                  className="absolute inset-0 h-full w-full"
                  allowFullScreen
                />
              </div>
            ) : (
              <Image
                src={mediaUrl}
                alt="Media content"
                fill
                className={cn(
                  "object-cover transition-all duration-500",
                  isLoaded ? "opacity-100 blur-0" : "opacity-0 blur-sm",
                  isHovered && "scale-105"
                )}
                sizes="(max-width: 640px) 50vw, 33vw"
                onLoad={() => setIsLoaded(true)}
              />
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

      {/* Hover overlay with actions */}
      <AnimatePresence>
        {isHovered && canViewMedia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
          >
            <div className="glass-button flex size-12 items-center justify-center rounded-full">
              {isVideo ? (
                <Play className="text-primary ml-0.5 size-6" />
              ) : (
                <ImageIcon className="text-primary size-5" />
              )}
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
  currentUser,
}: {
  authorId: Id<"users">
  currentUser: Doc<"users">
}) => {
  const userGallery = useQuery(api.posts.getUserGallery, { authorId })
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerIndex, setViewerIndex] = useState(0)

  const subscriptionStatus = useQuery(api.subscriptions.getFollowSubscription, {
    creatorId: authorId,
    subscriberId: currentUser._id,
  })

  const isSubscriber = subscriptionStatus?.status === "active"
  const isOwnProfile = authorId === currentUser._id

  const galleryData = userGallery

  const mediaList = useMemo(() => {
    if (!galleryData) return [] as string[]
    return galleryData
      .filter((item) => {
        const isMediaProtected = item.visibility === "subscribers_only"
        const canViewMedia =
          isOwnProfile ||
          !isMediaProtected ||
          isSubscriber ||
          currentUser.accountType === "SUPERUSER"
        return canViewMedia
      })
      .map((i) => i.mediaUrl)
  }, [galleryData, isOwnProfile, isSubscriber, currentUser.accountType])

  const openViewerAt = useCallback(
    (mediaUrl: string) => {
      const idx = mediaList.indexOf(mediaUrl)
      if (idx === -1) return
      setViewerIndex(idx)
      setViewerOpen(true)
    },
    [mediaList]
  )

  // Split items into columns for masonry layout
  const columns = useMemo(() => {
    if (!userGallery) return [[], [], []]
    const cols: typeof userGallery[] = [[], [], []]
    userGallery.forEach((item, index) => {
      cols[index % 3].push(item)
    })
    return cols
  }, [userGallery])

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
                MASONRY_HEIGHTS[i % MASONRY_HEIGHTS.length]
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
      {/* Masonry Grid */}
      <motion.div
        variants={containerVariants}
        initial="initial"
        animate="animate"
        className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3"
      >
        {/* Column 1 */}
        <div className="flex flex-col">
          {columns[0].map((item, i) => {
            const isMediaProtected = item.visibility === "subscribers_only"
            const canViewMedia =
              isOwnProfile ||
              !isMediaProtected ||
              isSubscriber ||
              currentUser.accountType === "SUPERUSER"

            return (
              <GalleryItem
                key={item._id}
                item={item}
                index={i * 3}
                canViewMedia={canViewMedia}
                isMediaProtected={isMediaProtected}
                onOpen={() => openViewerAt(item.mediaUrl)}
              />
            )
          })}
        </div>

        {/* Column 2 */}
        <div className="flex flex-col">
          {columns[1].map((item, i) => {
            const isMediaProtected = item.visibility === "subscribers_only"
            const canViewMedia =
              isOwnProfile ||
              !isMediaProtected ||
              isSubscriber ||
              currentUser.accountType === "SUPERUSER"

            return (
              <GalleryItem
                key={item._id}
                item={item}
                index={i * 3 + 1}
                canViewMedia={canViewMedia}
                isMediaProtected={isMediaProtected}
                onOpen={() => openViewerAt(item.mediaUrl)}
              />
            )
          })}
        </div>

        {/* Column 3 - Hidden on mobile */}
        <div className="hidden flex-col sm:flex">
          {columns[2].map((item, i) => {
            const isMediaProtected = item.visibility === "subscribers_only"
            const canViewMedia =
              isOwnProfile ||
              !isMediaProtected ||
              isSubscriber ||
              currentUser.accountType === "SUPERUSER"

            return (
              <GalleryItem
                key={item._id}
                item={item}
                index={i * 3 + 2}
                canViewMedia={canViewMedia}
                isMediaProtected={isMediaProtected}
                onOpen={() => openViewerAt(item.mediaUrl)}
              />
            )
          })}
        </div>
      </motion.div>

      <FullscreenImageViewer
        medias={mediaList}
        index={viewerIndex}
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
        onIndexChange={setViewerIndex}
      />
    </>
  )
}
