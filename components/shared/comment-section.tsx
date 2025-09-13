"use client"

import { useMutation } from "convex/react"
import { Loader2, Send } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { ProfileImage } from "@/components/shared/profile-image"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { api } from "@/convex/_generated/api"
import { Doc, Id } from "@/convex/_generated/dataModel"

type CommentSectionProps = {
  postId: Id<"posts">
  currentUser: Doc<"users">
  isOpen: boolean
  disabled?: boolean
}

export const CommentSection = ({
  postId,
  currentUser,
  isOpen,
  disabled = false,
}: CommentSectionProps) => {
  const [commentText, setCommentText] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const addComment = useMutation(api.comments.addComment)

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

  if (!isOpen) return null

  return (
    <div className="mt-3 border-t pt-3" onClick={(e) => e.stopPropagation()}>
      {disabled ? (
        <div className="flex items-center justify-center py-4">
          <p className="text-muted-foreground text-sm">
            Abonnez-vous pour commenter ce post
          </p>
        </div>
      ) : (
        <form
          onSubmit={handleSubmitComment}
          className="flex gap-3"
          onClick={(e) => e.stopPropagation()}
        >
          <Avatar className="h-8 w-8 shrink-0">
            {currentUser.image ? (
              <ProfileImage
                src={currentUser.image}
                width={32}
                height={32}
                alt={currentUser.username || "Profile image"}
              />
            ) : (
              <AvatarFallback className="text-xs">
                {currentUser.name?.charAt(0) || "U"}
              </AvatarFallback>
            )}
          </Avatar>

          <div className="flex-1 space-y-2">
            <Textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              placeholder="Écrivez un commentaire..."
              className="border-muted-foreground/20 min-h-[60px] resize-none text-sm"
              disabled={isSubmitting}
            />

            <div className="flex justify-end">
              <Button
                type="submit"
                size="sm"
                disabled={!commentText.trim() || isSubmitting}
                className="rounded-full"
                onClick={(e) => e.stopPropagation()}
              >
                {isSubmitting ? (
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                ) : (
                  <Send className="mr-1 h-3 w-3" />
                )}
                {isSubmitting ? "Publication..." : "Commenter"}
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  )
}
