"use client"

import { useMutation, useQuery } from "convex/react"
import { Loader2, Send } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { CommentItem } from "@/components/shared/comment-item"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { api } from "@/convex/_generated/api"
import { Doc, Id } from "@/convex/_generated/dataModel"

type CommentSectionProps = {
  postId: Id<"posts">
  currentUser: Doc<"users">
  isOpen: boolean
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

export const CommentSection = ({
  postId,
  currentUser,
  isOpen,
  disabled = false,
  onClose,
}: CommentSectionProps) => {
  const [commentText, setCommentText] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showAllComments, setShowAllComments] = useState(false)

  const addComment = useMutation(api.comments.addComment)

  const recentComments = useQuery(api.comments.getRecentComments, {
    postId,
    limit: 3,
  })

  const allComments = useQuery(
    api.comments.listPostComments,
    showAllComments ? { postId } : "skip",
  )

  const commentCount = useQuery(api.comments.countForPost, { postId })
  const totalComments = commentCount?.count || 0

  const comments = showAllComments ? allComments : recentComments

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
      console.error("Error creating comment:", error)
      toast.error("Erreur lors de la publication du commentaire")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEmojiClick = (emoji: string) => {
    setCommentText((prev) => prev + emoji)
  }

  if (!isOpen) return null

  const isLoading = recentComments === undefined

  return (
    <div className="mt-2" onClick={(e) => e.stopPropagation()}>
      {disabled ? (
        <div className="flex items-center justify-center py-4">
          <p className="text-muted-foreground text-sm">
            Abonnez-vous pour commenter ce post
          </p>
        </div>
      ) : (
        <>
          {/* Loader pendant le chargement */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="text-primary h-6 w-6 animate-spin" />
            </div>
          ) : (
            <>
              {/* Liste des commentaires */}
              {comments && comments.length > 0 && (
                <div className="mb-3 space-y-3">
                  {comments.map((comment) => (
                    <CommentItem key={comment._id} comment={comment} />
                  ))}
                </div>
              )}

              {/* Bouton "Voir plus" */}
              {!showAllComments && totalComments > 3 && (
                <div className="mb-3 px-4">
                  <button
                    onClick={() => setShowAllComments(true)}
                    className="text-primary cursor-pointer text-sm font-medium hover:underline"
                  >
                    Voir plus de commentaires
                  </button>
                </div>
              )}
            </>
          )}

          {/* Barre d'emojis */}
          <div className="mb-3 flex gap-2 overflow-x-auto px-4 pb-2">
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleEmojiClick(emoji)}
                className="text-2xl transition-transform hover:scale-125"
                aria-label={`Ajouter ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Formulaire de commentaire */}
          <form
            onSubmit={handleSubmitComment}
            className="px-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex gap-3">
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarImage
                  src={currentUser.image}
                  alt={currentUser.username || "Profile image"}
                  className="object-cover"
                />
                <AvatarFallback className="text-xs">
                  {currentUser.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>

              <div className="flex flex-1 items-center gap-2">
                <Textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="Ajouter un commentaire..."
                  className="border-muted-foreground/20 min-h-[40px] resize-none text-sm"
                  disabled={isSubmitting}
                  rows={1}
                />

                <Button
                  type="submit"
                  size="icon"
                  disabled={!commentText.trim() || isSubmitting}
                  className="shrink-0 rounded-full"
                  onClick={(e) => e.stopPropagation()}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </form>

          {/* Bouton "Masquer les commentaires" */}
          <div className="mt-3 px-4">
            <button
              onClick={() => {
                setShowAllComments(false)
                onClose?.()
              }}
              className="text-muted-foreground cursor-pointer text-sm hover:underline"
            >
              Masquer les commentaires
            </button>
          </div>
        </>
      )}
    </div>
  )
}
