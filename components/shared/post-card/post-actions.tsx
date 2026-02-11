"use client"

import { useMutation, useQuery } from "convex/react"
import { motion, AnimatePresence } from "motion/react"
import {
  Bookmark,
  CheckCircle,
  Coins,
  Heart,
  MessageCircle,
  Share2,
} from "lucide-react"
import { useTransition, useState, useCallback } from "react"
import { toast } from "sonner"
import { TipDialog } from "@/components/domains/tips"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { api } from "@/convex/_generated/api"
import { Doc, Id } from "@/convex/_generated/dataModel"
import { heartPulseVariants, bookmarkVariants } from "@/lib/animations"
import { logger } from "@/lib/config"
import { cn } from "@/lib/utils"

type PostActionsProps = {
  postId: Id<"posts">
  postUrl: string
  disabled?: boolean
  isCommentsOpen: boolean
  onToggleComments: () => void
  /** Hide comment button (for post detail page) */
  hideCommentButton?: boolean
  /** Post author — needed for tip button */
  author?: Doc<"users">
  /** Current user ID — to hide tip on own posts */
  currentUserId?: Id<"users">
}

export const PostActions = ({
  postId,
  postUrl,
  disabled = false,
  isCommentsOpen,
  onToggleComments,
  hideCommentButton = false,
  author,
  currentUserId,
}: PostActionsProps) => {
  const [isLikePending, startLikeTransition] = useTransition()
  const [isBookmarkPending, startBookmarkTransition] = useTransition()

  // Like state
  const likedQuery = useQuery(api.likes.isLiked, { postId })
  const isLiked = likedQuery?.liked || false
  const likeCountData = useQuery(api.likes.countLikes, { postId })
  const likeCount = likeCountData?.count || 0

  // Comment count
  const commentCountData = useQuery(api.comments.countForPost, { postId })
  const commentCount = commentCountData?.count || 0

  // Bookmark state
  const bookmarkedQuery = useQuery(api.bookmarks.isBookmarked, { postId })
  const isBookmarked = bookmarkedQuery?.bookmarked || false

  // Mutations
  const likePost = useMutation(api.likes.likePost)
  const unlikePost = useMutation(api.likes.unlikePost)
  const addBookmark = useMutation(api.bookmarks.addBookmark)
  const removeBookmark = useMutation(api.bookmarks.removeBookmark)

  // Track animation triggers
  const [shouldAnimateLike, setShouldAnimateLike] = useState(false)
  const [shouldAnimateBookmark, setShouldAnimateBookmark] = useState(false)

  // Animation trigger functions
  const triggerLikeAnimation = useCallback(() => {
    setShouldAnimateLike(true)
    setTimeout(() => setShouldAnimateLike(false), 500)
  }, [])

  const triggerBookmarkAnimation = useCallback(() => {
    setShouldAnimateBookmark(true)
    setTimeout(() => setShouldAnimateBookmark(false), 500)
  }, [])

  // Handlers
  const handleToggleLike = () => {
    if (disabled || isLikePending) return
    startLikeTransition(async () => {
      try {
        if (isLiked) {
          await unlikePost({ postId })
        } else {
          await likePost({ postId })
          triggerLikeAnimation()
        }
      } catch (error) {
        logger.error("Erreur toggle like", error, { postId, isLiked })
        toast.error("Une erreur s'est produite !")
      }
    })
  }

  const handleToggleBookmark = () => {
    if (disabled || isBookmarkPending) return
    startBookmarkTransition(async () => {
      try {
        if (isBookmarked) {
          await removeBookmark({ postId })
          toast.success("Retiré des collections")
        } else {
          await addBookmark({ postId })
          triggerBookmarkAnimation()
          toast.success("Ajouté aux collections")
        }
      } catch (error) {
        logger.error("Erreur toggle bookmark", error, { postId })
        toast.error("Une erreur s'est produite !")
      }
    })
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: "Partager ce post",
          url: postUrl,
        })
        .catch(() => {
          // Fallback
          navigator.clipboard.writeText(postUrl).then(() => {
            toast.success("Lien copié !", {
              icon: <CheckCircle className="size-4" />,
            })
          })
        })
    } else {
      navigator.clipboard.writeText(postUrl).then(() => {
        toast.success("Lien copié !", {
          icon: <CheckCircle className="size-4" />,
        })
      })
    }
  }

  // Format count for display
  const formatCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`
    }
    return count.toString()
  }

  return (
    <div className="px-4">
      {/* Subtle divider */}
      <div className="h-px bg-border mb-3" />

      <div className="flex items-center justify-between">
        {/* Left actions group */}
        <div className="flex items-center gap-0.5">
          {/* Like button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  handleToggleLike()
                }}
                disabled={disabled || isLikePending}
                className={cn(
                  "group h-10 gap-2 rounded-full px-4 transition-all duration-300",
                  disabled && "cursor-not-allowed opacity-50",
                  isLiked
                    ? "text-red-500 hover:bg-red-500/10"
                    : "text-muted-foreground hover:bg-red-500/10 hover:text-red-500",
                )}
              >
                <motion.div
                  variants={heartPulseVariants}
                  animate={shouldAnimateLike ? "liked" : "initial"}
                >
                  <Heart
                    className={cn(
                      "size-5 transition-all duration-300",
                      isLiked && "fill-current drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]",
                    )}
                  />
                </motion.div>
                <AnimatePresence mode="wait">
                  {likeCount > 0 && (
                    <motion.span
                      key={likeCount}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className={cn(
                        "text-sm font-semibold tabular-nums",
                        isLiked && "text-red-500",
                      )}
                    >
                      {formatCount(likeCount)}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={4}>
              {isLiked ? "Retirer le j'aime" : "J'aime"}
            </TooltipContent>
          </Tooltip>

          {/* Comment button - hidden in detail view */}
          {!hideCommentButton && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (!disabled) onToggleComments()
                  }}
                  disabled={disabled}
                  className={cn(
                    "group h-10 gap-2 rounded-full px-4 transition-all duration-300",
                    disabled && "cursor-not-allowed opacity-50",
                    isCommentsOpen
                      ? "text-primary hover:bg-primary/10"
                      : "text-muted-foreground hover:bg-primary/10 hover:text-primary",
                  )}
                >
                  <MessageCircle
                    className={cn(
                      "size-5 transition-transform duration-300",
                      "group-hover:scale-110",
                      isCommentsOpen && "fill-primary/30",
                    )}
                  />
                  {commentCount > 0 && (
                    <span className={cn(
                      "text-sm font-semibold tabular-nums",
                      isCommentsOpen && "text-primary",
                    )}>
                      {formatCount(commentCount)}
                    </span>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={4}>
                {isCommentsOpen ? "Masquer les commentaires" : "Commenter"}
              </TooltipContent>
            </Tooltip>
          )}

          {/* Share button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  handleShare()
                }}
                className={cn(
                  "group h-10 rounded-full px-4 transition-all duration-300",
                  "text-muted-foreground hover:bg-primary/10 hover:text-primary",
                )}
              >
                <Share2 className="size-5 transition-transform duration-300 group-hover:scale-110" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={4}>
              Partager
            </TooltipContent>
          </Tooltip>

          {/* Tip button — visible on other creators' posts only */}
          {author && author.accountType === "CREATOR" && currentUserId && currentUserId !== author._id && (
            <TipDialog
              creator={author}
              context="post"
              postId={postId}
              trigger={
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "group h-10 rounded-full px-4 transition-all duration-300",
                        "text-muted-foreground hover:bg-amber-500/10 hover:text-amber-500",
                      )}
                    >
                      <Coins className="size-5 transition-transform duration-300 group-hover:scale-110" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" sideOffset={4}>
                    Envoyer un pourboire
                  </TooltipContent>
                </Tooltip>
              }
            />
          )}
        </div>

        {/* Right actions group */}
        <div className="flex items-center">
          {/* Bookmark button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  handleToggleBookmark()
                }}
                disabled={disabled || isBookmarkPending}
                className={cn(
                  "group h-10 rounded-full px-4 transition-all duration-300",
                  disabled && "cursor-not-allowed opacity-50",
                  isBookmarked
                    ? "text-primary hover:bg-primary/10"
                    : "text-muted-foreground hover:bg-primary/10 hover:text-primary",
                )}
              >
                <motion.div
                  variants={bookmarkVariants}
                  animate={shouldAnimateBookmark ? "bookmarked" : "initial"}
                >
                  <Bookmark
                    className={cn(
                      "size-5 transition-all duration-300",
                      isBookmarked && "fill-primary",
                    )}
                  />
                </motion.div>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={4}>
              {isBookmarked
                ? "Retirer des collections"
                : "Ajouter aux collections"}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  )
}
