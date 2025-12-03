"use client"

import { useQuery } from "convex/react"
import { Lock } from "lucide-react"
import Image from "next/image"
import { useCallback, useMemo, useState } from "react"
import { FullscreenImageViewer } from "@/components/shared/fullscreen-image-viewer"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { api } from "@/convex/_generated/api"
import { Doc, Id } from "@/convex/_generated/dataModel"
import { cn } from "@/lib/utils"

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

  // Vérifier si l'utilisateur est abonné à l'auteur pour accéder aux contenus protégés
  const subscriptionStatus = useQuery(api.subscriptions.getFollowSubscription, {
    creatorId: authorId,
    subscriberId: currentUser._id,
  })

  const isSubscriber = subscriptionStatus?.status === "active"
  const isOwnProfile = authorId === currentUser._id

  // Déstructurer userGallery pour une dépendance stable
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
    [mediaList],
  )

  const isVideo = (media: string) =>
    media.startsWith("https://iframe.mediadelivery.net/embed/")

  return (
    <>
      {!userGallery || userGallery.length === 0 ? (
        <div className="text-muted-foreground mt-16 h-full px-4 text-center text-xl">
          Pas de médias pour le moment
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1 p-1 pb-2 max-sm:grid-cols-2">
          {userGallery.map((item) => {
            const isMediaProtected = item.visibility === "subscribers_only"
            const canViewMedia =
              isOwnProfile ||
              !isMediaProtected ||
              isSubscriber ||
              currentUser.accountType === "SUPERUSER"
            const mediaUrl = item.mediaUrl
            const isVideoMedia = isVideo(mediaUrl)

            return (
              <div key={item._id} className="relative aspect-square">
                <AspectRatio ratio={1} className="overflow-hidden">
                  <div
                    className={cn(
                      "relative h-full w-full cursor-pointer",
                      !canViewMedia && "bg-muted/50 backdrop-blur-xs",
                    )}
                    onClick={() => {
                      if (canViewMedia) {
                        openViewerAt(mediaUrl)
                      }
                    }}
                  >
                    {canViewMedia ? (
                      <div className="relative h-full w-full">
                        {isVideoMedia ? (
                          <div className="bg-muted/20 flex h-full w-full items-center justify-center">
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
                            width={400}
                            height={400}
                            className="h-full w-full object-cover transition-transform hover:scale-105"
                            sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 20vw"
                          />
                        )}
                      </div>
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Lock className="text-muted-foreground size-8" />
                      </div>
                    )}
                  </div>
                </AspectRatio>

                {isMediaProtected && (
                  <div className="bg-background/80 absolute top-1.5 right-1.5 rounded-md p-1">
                    <Lock className="text-primary size-4" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

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
