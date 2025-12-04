"use client"

import { useQuery } from "convex/react"
import { useState } from "react"
import { CommentSection } from "@/components/shared/comment-section"
import { PostActions } from "@/components/shared/post-card/post-actions"
import { PostContent } from "@/components/shared/post-card/post-content"
import { PostHeader } from "@/components/shared/post-card/post-header"
import { PostMedia } from "@/components/shared/post-media"
import { SubscriptionModal } from "@/components/shared/subscription-modal"
import { TooltipProvider } from "@/components/ui/tooltip"
import { api } from "@/convex/_generated/api"
import { Doc } from "@/convex/_generated/dataModel"
import { cn } from "@/lib/utils"

// ExtendedPost is a type that represents a post with an extended author field.
type ExtendedPost = Omit<Doc<"posts">, "author"> & {
  author: Doc<"users"> | null | undefined
}

type PostCardProps = {
  post: ExtendedPost
  currentUser: Doc<"users">
  /** Variant de style du card */
  variant?: "default" | "compact" | "featured"
}

export const PostCard = ({
  post,
  currentUser,
  variant = "default",
}: PostCardProps) => {
  const [isCommentsOpen, setIsCommentsOpen] = useState(false)
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false)

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

  // URL du post pour le partage
  const host = typeof window !== "undefined" ? window.location.origin : ""
  const postUrl = `${host}/${post.author?.username}/post/${post._id}`

  const toggleComments = () => {
    setIsCommentsOpen(!isCommentsOpen)
  }

  return (
    <>
      <TooltipProvider>
        <article
          className={cn(
            // Base styles
            "group relative",
            "bg-background",
            "border-border/50 border-b",
            "transition-colors duration-200",
            "hover:bg-muted/30",
            // Variants
            variant === "featured" && [
              "border-primary/20 rounded-xl border",
              "from-primary/5 bg-linear-to-b to-transparent",
            ],
            variant === "compact" && "py-2",
          )}
        >
          {/* Main content wrapper */}
          <div
            className={cn(
              "flex flex-col gap-3",
              variant === "default" && "py-4",
              variant === "compact" && "py-2",
              variant === "featured" && "py-5",
            )}
          >
            {/* Header: Avatar, Author info, Date, Actions */}
            <PostHeader
              author={post.author}
              postId={post._id}
              createdAt={post._creationTime}
              visibility={post.visibility || "public"}
              currentUser={currentUser}
              canViewMedia={canViewMedia}
              onRequireSubscribe={() => setIsSubscriptionModalOpen(true)}
            />

            {/* Content: Post text */}
            {post.content && <PostContent content={post.content} />}

            {/* Media: Images/Videos */}
            {hasMedia && (
              <div className="px-4">
                <div className="overflow-hidden rounded-xl">
                  <PostMedia
                    medias={post.medias}
                    canView={canViewMedia}
                    authorUsername={post.author?.username}
                    onRequireSubscribe={() => setIsSubscriptionModalOpen(true)}
                  />
                </div>
              </div>
            )}

            {/* Actions: Like, Comment, Share, Bookmark */}
            <PostActions
              postId={post._id}
              postUrl={postUrl}
              disabled={!canViewMedia}
              isCommentsOpen={isCommentsOpen}
              onToggleComments={toggleComments}
            />

            {/* Comments section */}
            <CommentSection
              postId={post._id}
              currentUser={currentUser}
              isOpen={isCommentsOpen}
              disabled={!canViewMedia}
              onClose={toggleComments}
            />
          </div>
        </article>
      </TooltipProvider>

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
