"use client"

import { useMutation, useQuery } from "convex/react"
import { Ellipsis, Flag, LoaderCircle, Pencil, Trash2 } from "lucide-react"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { ReportDialog } from "@/components/shared/report-dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Textarea } from "@/components/ui/textarea"
import { api } from "@/convex/_generated/api"
import { Doc, Id } from "@/convex/_generated/dataModel"
import { logger } from "@/lib/config/logger"

export const CommentEllipsis = ({
  commentId,
  author,
  initialContent,
}: {
  commentId: Id<"comments">
  author: Doc<"users"> | null | undefined
  initialContent: string
}) => {
  const [isPending, startTransition] = useTransition()
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editContent, setEditContent] = useState(initialContent)
  const [isUpdating, setIsUpdating] = useState(false)
  const [showReportDialog, setShowReportDialog] = useState(false)

  const deleteComment = useMutation(api.comments.deleteComment)
  const updateComment = useMutation(api.comments.updateComment)
  const currentUser = useQuery(api.users.getCurrentUser, {})

  const isOwner = currentUser && author?._id === currentUser._id

  const deleteHandler = async () => {
    startTransition(async () => {
      try {
        await deleteComment({ commentId })
        toast.success("Votre commentaire a été supprimé")
      } catch (error) {
        logger.error("Failed to delete comment", error, { commentId })
        toast.error("Une erreur s'est produite !", {
          description:
            "Veuillez vérifier votre connexion internet et réessayer",
        })
      }
    })
  }

  const updateHandler = async () => {
    if (!editContent.trim() || editContent === initialContent) {
      setIsEditOpen(false)
      return
    }

    setIsUpdating(true)
    try {
      await updateComment({ commentId, content: editContent.trim() })
      toast.success("Commentaire modifié")
      setIsEditOpen(false)
    } catch (error) {
      logger.error("Failed to update comment", error, { commentId })
      toast.error("Erreur lors de la modification")
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
        <Button size="icon" variant="ghost" className="h-8 w-8">
          <Ellipsis className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-60" align="end">
        {/* Option d'édition (seulement pour le propriétaire) */}
        {isOwner && (
          <>
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
              <DialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Modifier le commentaire
                </DropdownMenuItem>
              </DialogTrigger>
              <DialogContent onClick={(e) => e.stopPropagation()}>
                <DialogHeader>
                  <DialogTitle>Modifier votre commentaire</DialogTitle>
                  <DialogDescription>
                    Apportez des modifications à votre commentaire
                  </DialogDescription>
                </DialogHeader>
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[100px]"
                  placeholder="Écrivez votre commentaire..."
                />
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditContent(initialContent)
                      setIsEditOpen(false)
                    }}
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={updateHandler}
                    disabled={isUpdating || !editContent.trim()}
                  >
                    {isUpdating ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : (
                      "Enregistrer"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <DropdownMenuSeparator />
          </>
        )}

        {/* Option de suppression (seulement pour le propriétaire) */}
        {isOwner && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <DropdownMenuItem
                variant="destructive"
                onSelect={(e) => e.preventDefault()}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer le commentaire
              </DropdownMenuItem>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action ne peut pas être annulée. Cela supprimera
                  définitivement votre commentaire.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={deleteHandler} disabled={isPending}>
                  {isPending ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    "Supprimer"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {/* Option de signalement */}
        {!isOwner && author && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => setShowReportDialog(true)}
            >
              <Flag className="mr-2 h-4 w-4" />
              Signaler le commentaire
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>

      {/* Dialogue de signalement - rendu en dehors du dropdown */}
      {!isOwner && author && (
        <ReportDialog
          reportedUserId={author._id}
          reportedCommentId={commentId}
          type="comment"
          username={author.username || undefined}
          isOpen={showReportDialog}
          onClose={() => setShowReportDialog(false)}
        />
      )}
    </DropdownMenu>
  )
}
