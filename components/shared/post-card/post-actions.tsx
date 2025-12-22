"use client"

import { useMutation, useQuery } from "convex/react"
import {
  Bookmark,
  CheckCircle,
  Heart,
  MessageCircle,
  Share2,
} from "lucide-react"
import { useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { logger } from "@/lib/config"
import { cn } from "@/lib/utils"

type PostActionsProps = {
  postId: Id<"posts">
  postUrl: string
  disabled?: boolean
  isCommentsOpen: boolean
  onToggleComments: () => void
}

export const PostActions = ({
  postId,
  postUrl,
  disabled = false,
  isCommentsOpen,
  onToggleComments,
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

  // Handlers
  const handleToggleLike = () => {
    if (disabled || isLikePending) return
    startLikeTransition(async () => {
      try {
        if (isLiked) {
          await unlikePost({ postId })
        } else {
          await likePost({ postId })
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
      <div className="border-border/50 flex items-center justify-between border-t pt-2">
        {/* Left actions group */}
        <div className="flex items-center gap-1">
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
                  "group h-9 gap-1.5 rounded-full px-3 transition-all duration-200",
                  disabled && "cursor-not-allowed opacity-50",
                  isLiked
                    ? "text-red-500 hover:bg-red-500/10"
                    : "text-muted-foreground hover:bg-red-500/10 hover:text-red-500",
                )}
              >
                <Heart
                  className={cn(
                    "size-[18px] transition-transform duration-200",
                    "group-hover:scale-110",
                    isLiked && "fill-current",
                  )}
                />
                {likeCount > 0 && (
                  <span className="text-sm font-medium tabular-nums">
                    {formatCount(likeCount)}
                  </span>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={4}>
              {isLiked ? "Retirer le j'aime" : "J'aime"}
            </TooltipContent>
          </Tooltip>

          {/* Comment button */}
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
                  "group h-9 gap-1.5 rounded-full px-3 transition-all duration-200",
                  disabled && "cursor-not-allowed opacity-50",
                  isCommentsOpen
                    ? "text-blue-500 hover:bg-blue-500/10"
                    : "text-muted-foreground hover:bg-blue-500/10 hover:text-blue-500",
                )}
              >
                <MessageCircle
                  className={cn(
                    "size-[18px] transition-transform duration-200",
                    "group-hover:scale-110",
                  )}
                />
                {commentCount > 0 && (
                  <span className="text-sm font-medium tabular-nums">
                    {formatCount(commentCount)}
                  </span>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={4}>
              {isCommentsOpen ? "Masquer les commentaires" : "Commenter"}
            </TooltipContent>
          </Tooltip>

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
                  "group h-9 rounded-full px-3 transition-all duration-200",
                  "text-muted-foreground hover:bg-primary/10 hover:text-primary",
                )}
              >
                <Share2 className="size-[18px] transition-transform duration-200 group-hover:scale-110" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={4}>
              Partager
            </TooltipContent>
          </Tooltip>
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
                  "group h-9 rounded-full px-3 transition-all duration-200",
                  disabled && "cursor-not-allowed opacity-50",
                  isBookmarked
                    ? "text-primary hover:bg-primary/10"
                    : "text-muted-foreground hover:bg-primary/10 hover:text-primary",
                )}
              >
                <Bookmark
                  className={cn(
                    "size-[18px] transition-transform duration-200",
                    "group-hover:scale-110",
                    isBookmarked && "fill-current",
                  )}
                />
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
