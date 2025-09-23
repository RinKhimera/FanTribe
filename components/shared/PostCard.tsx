"use client"

import { useQuery } from "convex/react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import Link from "next/link"
import { useRouter } from "next/navigation"
import React, { useState } from "react"
import { PostMedia } from "@/components/blocs/PostMedia"
import { BookmarkButton } from "@/components/home/bookmark-button"
import { CommentButton } from "@/components/home/comment-button"
import { LikeButton } from "@/components/home/like-button"
import { PostEllipsis } from "@/components/home/post-ellipsis"
import { CommentSection } from "@/components/shared/comment-section"
import { SubscriptionModal } from "@/components/shared/subscription-modal"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
  const router = useRouter()

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
        className="hover:bg-muted/10 flex cursor-pointer space-x-4 border-b pt-4 pb-2 transition-colors"
        onClick={handlePostClick}
      >
        <div className="flex w-full flex-col">
          <div
            className="flex items-center justify-between pr-2 pl-4"
            onClick={(e) => e.stopPropagation()}
          >
            <Link href={`/${post.author?.username}`}>
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage
                    src={post.author?.image}
                    width={100}
                    height={100}
                    alt={post.author?.username || "Profile image"}
                    className="aspect-square h-full w-full object-cover"
                  />
                  <AvatarFallback className="size-11">
                    <div className="animate-pulse rounded-full bg-gray-500" />
                  </AvatarFallback>
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

          <div className="mt-2 w-full px-4 text-base">
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

          <div className="mt-1 flex flex-col">
            {/* Media section with conditional rendering */}
            {hasMedia && (
              <PostMedia
                medias={post.medias}
                canView={canViewMedia}
                authorUsername={post.author?.username}
                onRequireSubscribe={() => setIsSubscriptionModalOpen(true)}
              />
            )}

            <div className="flex flex-col gap-1 px-4">
              <div className="mt-2 flex w-full items-center justify-between">
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
