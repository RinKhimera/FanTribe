"use client"

import { useMutation, useQuery } from "convex/react"
import { Loader2, Send } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { useState } from "react"
import { toast } from "sonner"
import { CommentItem } from "@/components/shared/comment-item"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { api } from "@/convex/_generated/api"
import { Doc, Id } from "@/convex/_generated/dataModel"
import { commentSectionVariants, emojiPopVariants } from "@/lib/animations"
import { logger } from "@/lib/config/logger"
import { cn } from "@/lib/utils"
import { useOptionalPostCard } from "./post-card/post-card-context"

type CommentSectionProps = {
  postId?: Id<"posts">
  currentUser?: Doc<"users">
  isOpen?: boolean
  disabled?: boolean
  onClose?: () => void
}

const EMOJIS = [
  "😂",
  "😍",
  "😘",
  "😊",
  "😁",
  "😃",
  "😄",
  "😆",
  "🤣",
  "😅",
  "🥰",
]

export const CommentSection = (props: CommentSectionProps) => {
  const cardContext = useOptionalPostCard()

  const postId = props.postId ?? cardContext?.post._id
  const currentUser = props.currentUser ?? cardContext?.currentUser
  const isOpen = props.isOpen ?? cardContext?.isCommentsOpen ?? false
  const disabled =
    props.disabled ?? (cardContext ? !cardContext.canViewMedia : false)
  const onClose = props.onClose ?? cardContext?.toggleComments

  const [commentText, setCommentText] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showAllComments, setShowAllComments] = useState(false)

  const addComment = useMutation(api.comments.addComment)

  const recentComments = useQuery(
    api.comments.getRecentComments,
    postId ? { postId, limit: 3 } : "skip",
  )

  const allComments = useQuery(
    api.comments.listPostComments,
    postId && showAllComments ? { postId } : "skip",
  )

  const commentCount = useQuery(
    api.comments.countForPost,
    postId ? { postId } : "skip",
  )
  const totalComments = commentCount?.count || 0

  const comments = showAllComments ? allComments : recentComments

  if (!postId || !currentUser) return null

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()

    if (disabled || !commentText.trim()) return

    setIsSubmitting(true)

    try {
      await addComment({
        postId,
        content: commentText.trim(),
      })

      setCommentText("")
      toast.success("Commentaire publié !")
    } catch (error) {
      logger.error("Failed to create comment", error, { postId })
      toast.error("Erreur lors de la publication du commentaire")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEmojiClick = (emoji: string) => {
    setCommentText((prev) => prev + emoji)
  }

  const isLoading = recentComments === undefined

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={commentSectionVariants}
          initial="collapsed"
          animate="expanded"
          exit="collapsed"
          className="overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="pt-2">
            {disabled ? (
              <div className="mx-4 flex items-center justify-center py-6">
                <div className="glass-premium rounded-xl px-6 py-4 text-center">
                  <p className="text-muted-foreground text-sm">
                    Abonnez-vous pour commenter ce post
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Loader pendant le chargement */}
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="flex items-center gap-3">
                      <Loader2 className="text-primary h-5 w-5 animate-spin" />
                      <span className="text-muted-foreground text-sm">
                        Chargement…
                      </span>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Liste des commentaires */}
                    {comments && comments.length > 0 && (
                      <div className="mb-4 space-y-3">
                        {comments.map((comment, index) => (
                          <motion.div
                            key={comment._id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <CommentItem comment={comment} />
                          </motion.div>
                        ))}
                      </div>
                    )}

                    {/* Bouton "Voir plus" */}
                    {!showAllComments && totalComments > 3 && (
                      <div className="mb-4 px-4">
                        <button
                          onClick={() => setShowAllComments(true)}
                          className="text-primary hover:text-primary/80 cursor-pointer text-sm font-semibold transition-colors"
                        >
                          Voir plus de commentaires ({totalComments - 3})
                        </button>
                      </div>
                    )}
                  </>
                )}

                {/* Barre d'emojis - Premium pill style */}
                <div className="mb-4 px-4">
                  <div className="scrollbar-none flex gap-1 overflow-x-auto pb-1">
                    {EMOJIS.map((emoji, index) => (
                      <motion.button
                        key={emoji}
                        type="button"
                        custom={index}
                        variants={emojiPopVariants}
                        initial="initial"
                        animate="animate"
                        whileHover="hover"
                        whileTap="tap"
                        onClick={() => handleEmojiClick(emoji)}
                        className={cn(
                          "rounded-full p-2 text-xl",
                          "hover:bg-muted transition-colors",
                        )}
                        aria-label={`Ajouter ${emoji}`}
                      >
                        {emoji}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Formulaire de commentaire - Premium glass */}
                <form
                  onSubmit={handleSubmitComment}
                  className="px-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="glass-premium rounded-xl p-3">
                    <div className="flex gap-3">
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarImage
                          src={currentUser.image}
                          alt={currentUser.username || "Profile image"}
                          className="object-cover"
                        />
                        <AvatarFallback className="bg-muted text-muted-foreground text-sm font-semibold">
                          {currentUser.name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex flex-1 items-center gap-2">
                        <Textarea
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          placeholder="Ajouter un commentaire…"
                          className={cn(
                            "min-h-10 resize-none py-2.5 text-sm",
                            "placeholder:text-muted-foreground/60",
                          )}
                          disabled={isSubmitting}
                          rows={1}
                          aria-label="Commentaire"
                        />

                        <Button
                          type="submit"
                          size="icon"
                          disabled={!commentText.trim() || isSubmitting}
                          className={cn(
                            "h-10 w-10 shrink-0 rounded-full",
                            "disabled:cursor-not-allowed disabled:opacity-50",
                          )}
                          onClick={(e) => e.stopPropagation()}
                          aria-label="Envoyer"
                        >
                          {isSubmitting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </form>

                {/* Bouton "Masquer les commentaires" */}
                <div className="mt-4 px-4 pb-2">
                  <button
                    onClick={() => {
                      setShowAllComments(false)
                      onClose?.()
                    }}
                    className="text-muted-foreground/70 hover:text-primary cursor-pointer text-sm transition-colors"
                  >
                    Masquer les commentaires
                  </button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
