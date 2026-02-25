"use client"

import { useMutation, useQuery } from "convex/react"
import { motion, AnimatePresence } from "motion/react"
import { Loader2, Send, MessageCircle, Lock } from "lucide-react"
import { useState, useRef } from "react"
import { toast } from "sonner"
import TextareaAutosize from "react-textarea-autosize"
import { CommentItem } from "@/components/shared/comment-item"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { api } from "@/convex/_generated/api"
import { Doc, Id } from "@/convex/_generated/dataModel"
import { logger } from "@/lib/config/logger"
import { pluralize } from "@/lib/formatters"
import { cn } from "@/lib/utils"
import { premiumFeedItemVariants } from "@/lib/animations"

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
      <div className="flex items-center gap-2 px-4 py-3 border-border/40 border-t">
        <MessageCircle className="size-4 text-muted-foreground" aria-hidden="true" />
        <span className="text-sm font-medium text-muted-foreground">
          {totalComments} {pluralize(totalComments, "commentaire")}
        </span>
      </div>

      {/* Comment Input Area */}
      {canComment ? (
        <div className="px-4 py-4 border-border/40 border-t bg-muted/30">
          {/* Quick Emoji Bar */}
          <div className="flex gap-1 mb-3 overflow-x-auto pb-1 scrollbar-none -mx-1">
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
                  "text-lg px-2 py-1 rounded-lg shrink-0",
                  "hover:bg-muted transition-colors duration-150",
                )}
              >
                {emoji}
              </motion.button>
            ))}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmitComment}>
            <div className="flex gap-3 items-start">
              <Avatar className="size-10 shrink-0 ring-2 ring-background">
                <AvatarImage
                  src={currentUser.image}
                  alt={currentUser.username || "Profile"}
                  className="object-cover"
                />
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                  {currentUser.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 flex flex-col gap-2">
                <div
                  className={cn(
                    "relative rounded-2xl overflow-hidden",
                    "bg-background border border-border/60",
                    "focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10",
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
                      "focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring",
                    )}
                    disabled={isSubmitting}
                    minRows={1}
                    maxRows={6}
                  />
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground/60">
                    Entrée pour envoyer, Shift+Entrée pour nouvelle ligne
                  </span>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!commentText.trim() || isSubmitting}
                    className={cn(
                      "rounded-full px-4 h-8 gap-2",
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
        <div className="px-4 py-6 border-border/40 border-t">
          <div
            className={cn(
              "flex items-center justify-center gap-3",
              "px-6 py-4 rounded-2xl",
              "bg-muted/50 border border-border/40",
            )}
          >
            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="size-4 text-primary" aria-hidden="true" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">Contenu réservé aux abonnés</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Abonnez-vous pour commenter cette publication
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Comments List */}
      <div className="flex flex-col">
        {isLoading ? (
          <div className="flex items-center justify-center py-12 gap-3">
            <Loader2 className="text-primary size-5 animate-spin" />
            <span className="text-sm text-muted-foreground">
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
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <div className="size-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <MessageCircle className="size-7 text-muted-foreground/50" aria-hidden="true" />
            </div>
            <p className="text-muted-foreground text-sm text-center font-medium">
              Aucun commentaire
            </p>
            <p className="text-muted-foreground/60 text-xs text-center mt-1">
              Soyez le premier à commenter cette publication
            </p>
          </div>
        )}
      </div>
    </motion.div>
  )
}
