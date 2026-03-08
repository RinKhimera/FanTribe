"use client"

import { useMutation, useQuery } from "convex/react"
import { Loader2, Lock, MessageCircle, Send } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { useRef, useState } from "react"
import TextareaAutosize from "react-textarea-autosize"
import { toast } from "sonner"
import { CommentItem } from "@/components/shared/comment-item"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { api } from "@/convex/_generated/api"
import { Doc, Id } from "@/convex/_generated/dataModel"
import { premiumFeedItemVariants } from "@/lib/animations"
import { logger } from "@/lib/config/logger"
import { pluralize } from "@/lib/formatters"
import { cn } from "@/lib/utils"

type ExtendedPost = Omit<Doc<"posts">, "author"> & {
  author: Doc<"users"> | null | undefined
}

type PostDetailCommentsProps = {
  postId: Id<"posts">
  currentUser: Doc<"users">
  post: ExtendedPost
}

const QUICK_EMOJIS = ["❤️", "🔥", "👏", "😍", "💯", "🙌", "✨", "😂"]

export const PostDetailComments = ({
  postId,
  currentUser,
  post,
}: PostDetailCommentsProps) => {
  const [commentText, setCommentText] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const addComment = useMutation(api.comments.addComment)

  // Fetch ALL comments for detail view
  const comments = useQuery(api.comments.listPostComments, { postId })
  const commentCount = useQuery(api.comments.countForPost, { postId })
  const totalComments = commentCount?.count || 0

  // Check subscription for access control
  const subscriptionStatus = useQuery(
    api.subscriptions.getFollowSubscription,
    post.author
      ? {
          creatorId: post.author._id,
          subscriberId: currentUser._id,
        }
      : "skip",
  )

  const isOwnPost = currentUser._id === post.author?._id
  const isSubscriber = subscriptionStatus?.status === "active"
  const canComment =
    isOwnPost ||
    post.visibility === "public" ||
    isSubscriber ||
    currentUser.accountType === "SUPERUSER"

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentText.trim() || !canComment || isSubmitting) return

    setIsSubmitting(true)
    try {
      await addComment({ postId, content: commentText.trim() })
      setCommentText("")
      toast.success("Commentaire publié !")
    } catch (error) {
      logger.error("Failed to create comment", error, { postId })
      toast.error("Erreur lors de la publication")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEmojiClick = (emoji: string) => {
    setCommentText((prev) => prev + emoji)
    textareaRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmitComment(e)
    }
  }

  const isLoading = comments === undefined

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.15 }}
      className="flex flex-col"
    >
      {/* Comments Header */}
      <div className="border-border/40 flex items-center gap-2 border-t px-4 py-3">
        <MessageCircle
          className="text-muted-foreground size-4"
          aria-hidden="true"
        />
        <span className="text-muted-foreground text-sm font-medium">
          {totalComments} {pluralize(totalComments, "commentaire")}
        </span>
      </div>

      {/* Comment Input Area */}
      {canComment ? (
        <div className="border-border/40 bg-muted/30 border-t px-4 py-4">
          {/* Quick Emoji Bar */}
          <div className="scrollbar-none -mx-1 mb-3 flex gap-1 overflow-x-auto pb-1">
            {QUICK_EMOJIS.map((emoji, index) => (
              <motion.button
                key={emoji}
                type="button"
                onClick={() => handleEmojiClick(emoji)}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.03, duration: 0.2 }}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                className={cn(
                  "shrink-0 rounded-lg px-2 py-1 text-lg",
                  "hover:bg-muted transition-colors duration-150",
                )}
              >
                {emoji}
              </motion.button>
            ))}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmitComment}>
            <div className="flex items-start gap-3">
              <Avatar className="ring-background size-10 shrink-0 ring-2">
                <AvatarImage
                  src={currentUser.image}
                  alt={currentUser.username || "Profile"}
                  className="object-cover"
                />
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                  {currentUser.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>

              <div className="flex flex-1 flex-col gap-2">
                <div
                  className={cn(
                    "relative overflow-hidden rounded-2xl",
                    "bg-background border-border/60 border",
                    "focus-within:border-primary/50 focus-within:ring-primary/10 focus-within:ring-2",
                    "transition-[border-color,box-shadow] duration-200",
                  )}
                >
                  <TextareaAutosize
                    ref={textareaRef}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ajouter un commentaire…"
                    aria-label="Commentaire"
                    className={cn(
                      "w-full resize-none bg-transparent",
                      "px-4 py-3 text-sm leading-relaxed",
                      "placeholder:text-muted-foreground/50",
                      "focus-visible:ring-ring focus-visible:ring-1 focus-visible:outline-hidden",
                    )}
                    disabled={isSubmitting}
                    minRows={1}
                    maxRows={6}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground/60 text-xs">
                    Entrée pour envoyer, Shift+Entrée pour nouvelle ligne
                  </span>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!commentText.trim() || isSubmitting}
                    className={cn(
                      "h-8 gap-2 rounded-full px-4",
                      "disabled:opacity-40",
                    )}
                  >
                    {isSubmitting ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <>
                        <Send className="size-3.5" />
                        <span className="text-xs font-medium">Publier</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </div>
      ) : (
        /* Subscription required message */
        <div className="border-border/40 border-t px-4 py-6">
          <div
            className={cn(
              "flex items-center justify-center gap-3",
              "rounded-2xl px-6 py-4",
              "bg-muted/50 border-border/40 border",
            )}
          >
            <div className="bg-primary/10 flex size-10 items-center justify-center rounded-full">
              <Lock className="text-primary size-4" aria-hidden="true" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">Contenu réservé aux abonnés</p>
              <p className="text-muted-foreground mt-0.5 text-xs">
                Abonnez-vous pour commenter cette publication
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Comments List */}
      <div className="flex flex-col">
        {isLoading ? (
          <div className="flex items-center justify-center gap-3 py-12">
            <Loader2 className="text-primary size-5 animate-spin" />
            <span className="text-muted-foreground text-sm">
              Chargement des commentaires…
            </span>
          </div>
        ) : comments && comments.length > 0 ? (
          <AnimatePresence mode="popLayout">
            {comments.map((comment, index) => (
              <motion.div
                key={comment._id}
                variants={premiumFeedItemVariants}
                initial="initial"
                animate="animate"
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: index * 0.04 }}
                className={cn(
                  "border-border/30 border-t first:border-t-0",
                  "hover:bg-muted/30 transition-colors duration-150",
                )}
              >
                <div className="py-1">
                  <CommentItem comment={comment} />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center justify-center px-6 py-16">
            <div className="bg-muted/50 mb-4 flex size-16 items-center justify-center rounded-full">
              <MessageCircle
                className="text-muted-foreground/50 size-7"
                aria-hidden="true"
              />
            </div>
            <p className="text-muted-foreground text-center text-sm font-medium">
              Aucun commentaire
            </p>
            <p className="text-muted-foreground/60 mt-1 text-center text-xs">
              Soyez le premier à commenter cette publication
            </p>
          </div>
        )}
      </div>
    </motion.div>
  )
}
