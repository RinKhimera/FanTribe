import { useMutation, useQuery } from "convex/react"
import { Ellipsis, LoaderCircle } from "lucide-react"
import { useTransition } from "react"
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { api } from "@/convex/_generated/api"
import { Doc, Id } from "@/convex/_generated/dataModel"

export const CommentEllipsis = ({
  commentId,
  author,
}: {
  commentId: Id<"comments">
  author: Doc<"users"> | null | undefined
}) => {
  const [isPending, startTransition] = useTransition()

  const deleteComment = useMutation(api.comments.deleteComment)
  const currentUser = useQuery(api.users.getCurrentUser, {})

  const isOwner = currentUser && author?._id === currentUser._id

  const deleteHandler = async () => {
    startTransition(async () => {
      try {
        await deleteComment({ commentId })
        toast.success("Votre commentaire a été supprimé")
      } catch (error) {
        console.error(error)
        toast.error("Une erreur s'est produite !", {
          description:
            "Veuillez vérifier votre connexion internet et réessayer",
        })
      }
    })
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size={"icon"} variant="ghost">
          <Ellipsis />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-1" side="right">
        {/* Option de suppression (seulement pour le propriétaire) */}
        {isOwner && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" className="w-full justify-start">
                Supprimer le commentaire
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Etes-vous absolument sûr ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action ne peut pas être annulée. Cela supprimera
                  définitivement votre commentaire.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={deleteHandler} disabled={isPending}>
                  {isPending ? (
                    <LoaderCircle className="animate-spin" />
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
          <ReportDialog
            reportedUserId={author._id}
            reportedCommentId={commentId}
            type="comment"
            triggerText="Signaler le commentaire"
            username={author.username || undefined}
          />
        )}
      </PopoverContent>
    </Popover>
  )
}
