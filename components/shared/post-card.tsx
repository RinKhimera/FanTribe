"use client"

import { useQuery } from "convex/react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Image as ImageIcon, Lock } from "lucide-react"
import { CldImage, CldVideoPlayer } from "next-cloudinary"
import "next-cloudinary/dist/cld-video-player.css"
import Link from "next/link"
import { useRouter } from "next/navigation"
import React, { useEffect, useState } from "react"
import { BookmarkButton } from "@/components/home/bookmark-button"
import { CommentButton } from "@/components/home/comment-button"
import { LikeButton } from "@/components/home/like-button"
import { PostEllipsis } from "@/components/home/post-ellipsis"
import { CommentSection } from "@/components/shared/comment-section"
import { ProfileImage } from "@/components/shared/profile-image"
import { SubscriptionModal } from "@/components/shared/subscription-modal"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { api } from "@/convex/_generated/api"
import { Doc } from "@/convex/_generated/dataModel"

// ExtendedPost is a type that represents a post with an extended author field.
// It's created by taking the original Doc<"posts"> type and omitting the 'author' field.
// Then, we add back the 'author' field but this time it's of type Doc<"users"> or null.
type ExtendedPost = Omit<Doc<"posts">, "author"> & {
  author: Doc<"users"> | null | undefined
}

type PostCardProps = {
  post: ExtendedPost
  currentUser: Doc<"users">
}

export const PostCard = ({ post, currentUser }: PostCardProps) => {
  const likeCountData = useQuery(api.likes.countLikes, { postId: post._id })
  const likeCount = likeCountData?.count || 0

  const commentCountData = useQuery(api.comments.countForPost, {
    postId: post._id,
  })
  const commentCount = commentCountData?.count || 0

  const [isCommentsOpen, setIsCommentsOpen] = useState(false)
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false)
  const [carouselApi, setCarouselApi] = useState<CarouselApi>()
  const [currentSlide, setCurrentSlide] = useState(0)
  const [slideCount, setSlideCount] = useState(0)

  const router = useRouter()

  // Gérer l'API du carousel
  useEffect(() => {
    if (!carouselApi) return

    setSlideCount(carouselApi.scrollSnapList().length)
    setCurrentSlide(carouselApi.selectedScrollSnap())

    carouselApi.on("select", () => {
      setCurrentSlide(carouselApi.selectedScrollSnap())
    })
  }, [carouselApi])

  const isOwnPost = currentUser._id === post.author?._id
  const isMediaProtected = post.visibility === "subscribers_only"
  const hasMedia = post.medias && post.medias.length > 0

  // Vérifier le statut d'abonnement directement dans le composant
  const subscriptionStatus = useQuery(
    api.subscriptions.getFollowSubscription,
    post.author
      ? {
          creatorId: post.author._id,
          subscriberId: currentUser._id,
        }
      : "skip",
  )

  const isSubscriber = subscriptionStatus?.status === "active"

  // Logique d'accès aux médias
  const canViewMedia =
    isOwnPost ||
    !isMediaProtected ||
    isSubscriber ||
    currentUser.accountType === "SUPERUSER"

  const handlePostClick = (e: React.MouseEvent) => {
    // Ne navigue que si le clic n'est pas sur un élément interactif
    if (
      !(e.target as HTMLElement).closest("button") &&
      !(e.target as HTMLElement).closest("a") &&
      !(e.target as HTMLElement).closest("textarea") &&
      !(e.target as HTMLElement).closest("form")
    ) {
      // Si l'utilisateur n'a pas accès au contenu restreint
      if (!canViewMedia && post.author && !isOwnPost) {
        setIsSubscriptionModalOpen(true)
      } else {
        // Navigation normale vers la page du post
        router.push(`/${post.author?.username}/post/${post._id}`)
      }
    }
  }

  const toggleComments = () => {
    setIsCommentsOpen(!isCommentsOpen)
  }

  return (
    <>
      <div
        className="hover:bg-muted/10 flex cursor-pointer space-x-4 border-b px-4 pt-4 pb-2 transition-colors"
        onClick={handlePostClick}
      >
        <div className="flex w-full flex-col">
          <div
            className="flex items-center justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            <Link href={`/${post.author?.username}`}>
              <div className="flex items-center gap-3">
                <Avatar>
                  {post.author?.image ? (
                    <ProfileImage
                      src={post.author.image}
                      width={100}
                      height={100}
                      alt={post.author.username || "Profile image"}
                    />
                  ) : (
                    <AvatarFallback className="size-11">
                      <div className="animate-pulse rounded-full bg-gray-500"></div>
                    </AvatarFallback>
                  )}
                </Avatar>

                <div className="text-left max-sm:text-sm">
                  <div className="font-bold">{post.author?.name}</div>
                  <div className="text-muted-foreground">
                    @{post.author?.username}
                  </div>
                </div>
              </div>
            </Link>

            <div className="text-muted-foreground flex items-center gap-3">
              <>
                {format(new Date(post._creationTime), "d MMMM", {
                  locale: fr,
                })}
              </>

              <PostEllipsis
                postId={post._id}
                currentUser={currentUser}
                postAuthorId={post.author?._id}
                visibility={post.visibility || "public"}
                postAuthorUsername={post.author?.username}
              />
            </div>
          </div>

          <div className="mt-1 flex flex-col sm:ml-[52px]">
            <div className="w-full text-base">
              {post.content
                .split("\n")
                .filter((line) => line.trim() !== "")
                .map((line, index) => (
                  <React.Fragment key={index}>
                    {line}
                    <br />
                  </React.Fragment>
                ))}
            </div>

            {/* Media section with conditional rendering */}
            {hasMedia && (
              <>
                {canViewMedia ? (
                  // Carousel pour les médias multiples ou affichage simple pour un seul média
                  post.medias.length > 1 ? (
                    <div
                      className="relative mt-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Carousel setApi={setCarouselApi}>
                        <CarouselContent>
                          {post.medias.map((media, index) => {
                            const isVideo = media.startsWith(
                              "https://res.cloudinary.com/onlyscam/video/",
                            )
                            return (
                              <CarouselItem key={media}>
                                {isVideo ? (
                                  <CldVideoPlayer
                                    width={1620}
                                    height={1080}
                                    src={media}
                                    logo={false}
                                    sourceTypes={["hls"]}
                                    transformation={{
                                      streaming_profile: "hd",
                                    }}
                                    className="rounded-md"
                                  />
                                ) : (
                                  <CldImage
                                    src={media}
                                    alt={""}
                                    width={500}
                                    height={500}
                                    className="max-h-[550px] w-full rounded-md object-cover"
                                  />
                                )}
                              </CarouselItem>
                            )
                          })}
                        </CarouselContent>
                        <CarouselPrevious
                          variant="secondary"
                          size={"icon"}
                          className="hover:bg-muted/30 left-2 bg-transparent"
                        />
                        <CarouselNext
                          variant="secondary"
                          size={"icon"}
                          className="hover:bg-muted/30 right-2 bg-transparent"
                        />
                      </Carousel>

                      {/* Badge indicateur de position */}
                      {slideCount > 1 && (
                        <div className="absolute bottom-1 left-1/2 z-10 -translate-x-1/2 transform">
                          <div className="bg-muted/40 flex cursor-default items-center gap-1 rounded px-2 py-1 text-xs font-medium">
                            <ImageIcon size={12} />
                            {currentSlide + 1}/{slideCount}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    // Affichage simple pour un seul média
                    <>
                      {post.medias.map((media) => {
                        const isVideo = media.startsWith(
                          "https://res.cloudinary.com/onlyscam/video/",
                        )
                        if (isVideo) {
                          return (
                            <div
                              key={media}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <CldVideoPlayer
                                width={1620}
                                height={1080}
                                src={media}
                                logo={false}
                                sourceTypes={["hls"]}
                                transformation={{
                                  streaming_profile: "hd",
                                }}
                                className="mt-2 rounded-md"
                              />
                            </div>
                          )
                        } else {
                          return (
                            <CldImage
                              key={media}
                              src={media}
                              alt={""}
                              width={500}
                              height={500}
                              className="mt-2 max-h-[550px] rounded-md object-cover"
                            />
                          )
                        }
                      })}
                    </>
                  )
                ) : (
                  // Locked media placeholder
                  <div className="bg-muted/20 mt-2 flex aspect-video w-full flex-col items-center justify-center rounded-md p-6">
                    <div className="bg-background/90 mb-3 rounded-full p-3">
                      <Lock className="text-primary size-6" />
                    </div>
                    <h3 className="mb-1 text-lg font-semibold">
                      Contenu exclusif
                    </h3>
                    <p className="text-muted-foreground mb-4 text-center text-sm">
                      Ce contenu est réservé aux abonnés de @
                      {post.author?.username}
                    </p>
                    <Button
                      variant="default"
                      size="sm"
                      className="rounded-full"
                      onClick={(e) => {
                        e.stopPropagation()
                        setIsSubscriptionModalOpen(true)
                      }}
                    >
                      S&apos;abonner pour voir
                    </Button>
                  </div>
                )}
              </>
            )}

            <div className="mt-2 -ml-[5px] flex w-full items-center justify-between">
              <div className="flex w-full items-center space-x-2">
                <div onClick={(e) => e.stopPropagation()}>
                  <LikeButton postId={post._id} disabled={!canViewMedia} />
                </div>
                <div onClick={(e) => e.stopPropagation()}>
                  <CommentButton
                    onToggleComments={toggleComments}
                    isCommentsOpen={isCommentsOpen}
                    disabled={!canViewMedia}
                  />
                </div>
              </div>
              <div onClick={(e) => e.stopPropagation()}>
                <BookmarkButton postId={post._id} disabled={!canViewMedia} />
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center gap-2 text-sm font-semibold tracking-tight">
                {likeCount > 0 && <span>{likeCount} j&apos;aime</span>}
                {commentCount > 0 && (
                  <>
                    {likeCount > 0 && <span>•</span>}
                    <span>
                      {commentCount} commentaire{commentCount > 1 ? "s" : ""}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Section des commentaires */}
            <CommentSection
              postId={post._id}
              currentUser={currentUser}
              isOpen={isCommentsOpen}
              disabled={!canViewMedia}
            />
          </div>
        </div>
      </div>

      {/* Modale d'abonnement */}
      {post.author && (
        <SubscriptionModal
          isOpen={isSubscriptionModalOpen}
          onClose={() => setIsSubscriptionModalOpen(false)}
          creator={post.author}
          currentUser={currentUser}
        />
      )}
    </>
  )
}
