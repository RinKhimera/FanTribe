"use client"

import { useMutation } from "convex/react"
import {
  CheckCircle,
  Ellipsis,
  Flag,
  LoaderCircle,
  Pencil,
  Pin,
  Share2,
  Sparkles,
  Trash2,
} from "lucide-react"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { EditPostDialog } from "@/components/shared/edit-post-dialog"
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
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { api } from "@/convex/_generated/api"
import { Doc, Id } from "@/convex/_generated/dataModel"
import { logger } from "@/lib/config"

type PostEllipsisProps = {
  postId: Id<"posts">
  currentUser: Doc<"users">
  postAuthorId?: Id<"users">
  visibility?: "public" | "subscribers_only"
  isAdult?: boolean
  postAuthorUsername?: string
  isPinned?: boolean
}

export const PostEllipsis = ({
  postId,
  currentUser,
  postAuthorId,
  visibility = "public",
  isAdult,
  postAuthorUsername,
  isPinned,
}: PostEllipsisProps) => {
  const [isPending, startTransition] = useTransition()
  const [showMaxPinnedDialog, setShowMaxPinnedDialog] = useState(false)
  const [isPinPending, setIsPinPending] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showReportDialog, setShowReportDialog] = useState(false)

  // Déterminer si l'utilisateur courant est l'auteur du post
  const isAuthor = postAuthorId === currentUser._id
  const isAdmin = currentUser.accountType === "SUPERUSER"
  const canDelete = isAuthor || isAdmin
  const canEdit = isAuthor || isAdmin

  const deletePost = useMutation(api.posts.deletePost)
  const togglePinnedPost = useMutation(api.users.togglePinnedPost)

  // Construction de l'URL complète du post pour le partage
  const host = typeof window !== "undefined" ? window.location.origin : ""
  const postUsername = postAuthorUsername
  const postUrl = `${host}/${postUsername}/post/${postId}`

  const deleteHandler = async () => {
    startTransition(async () => {
      try {
        await deletePost({ postId })
        toast.success("Votre publication a été supprimée")
      } catch (error) {
        logger.error("Erreur suppression post", error, { postId })
        toast.error("Une erreur s'est produite !", {
          description:
            "Veuillez vérifier votre connexion internet et réessayer",
        })
      }
    })
  }

  // Fonction de partage au lieu de copie
  const handleShareLink = () => {
    if (navigator.share) {
      // API Web Share si disponible (mobile principalement)
      navigator
        .share({
          title: "Partager ce post",
          url: postUrl,
        })
        .catch(() => {
          logger.warn("Fallback vers copie après échec partage", { postId })
          // Fallback sur la copie si le partage échoue
          handleCopyLink()
        })
    } else {
      // Fallback pour les navigateurs ne supportant pas l'API Share
      handleCopyLink()
    }
  }

  // Garder la fonction de copie comme fallback
  const handleCopyLink = () => {
    navigator.clipboard.writeText(postUrl).then(() => {
      toast.success("Lien copié !", {
        description: "Le lien du post a été copié dans le presse-papier",
        icon: <CheckCircle className="size-4" />,
      })
    })
  }

  const handlePinToggle = async (replaceOldest = false) => {
    setIsPinPending(true)
    try {
      const result = await togglePinnedPost({ postId, replaceOldest })
      if (result.maxReached) {
        setShowMaxPinnedDialog(true)
        setIsPinPending(false)
        return
      }
      if (result.pinned) {
        toast.success("Publication épinglée", {
          description: "Cette publication apparaîtra en haut de votre profil",
        })
      } else {
        toast.success("Publication désépinglée")
      }
      setShowMaxPinnedDialog(false)
    } catch (error) {
      logger.error("Erreur épinglage post", error, { postId })
      toast.error("Erreur lors de l'épinglage")
    } finally {
      setIsPinPending(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
        <Button size="icon" variant="ghost" aria-label="Plus d'options">
          <Ellipsis aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64">
        {/* Option d'épinglage - uniquement pour l'auteur */}
        {isAuthor && (
          <>
            <DropdownMenuItem
              onClick={() => handlePinToggle()}
              disabled={isPinPending}
            >
              <Pin className="mr-2 size-4" aria-hidden="true" />
              {isPinned ? "Désépingler du profil" : "Épingler au profil"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Option de partage (disponible pour tous) */}
        <DropdownMenuItem onClick={handleShareLink}>
          <Share2 className="mr-2 size-4" aria-hidden="true" />
          Partager la publication
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {/* Signaler - uniquement pour les non-auteurs */}
          {!isAuthor && !isAdmin && (
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => setShowReportDialog(true)}
            >
              <Flag className="mr-2 size-4" aria-hidden="true" />
              Signaler la publication
            </DropdownMenuItem>
          )}

          {/* Modifier - pour auteur ou admin */}
          {canEdit && postAuthorId && (
            <DropdownMenuItem onSelect={() => setShowEditDialog(true)}>
              <Pencil className="mr-2 size-4" aria-hidden="true" />
              Modifier la publication
            </DropdownMenuItem>
          )}

          {/* Supprimer - pour auteur ou admin */}
          {canDelete && (
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => setShowDeleteDialog(true)}
            >
              {isAuthor ? (
                <Trash2 className="mr-2 size-4" aria-hidden="true" />
              ) : (
                <Sparkles className="mr-2 size-4" aria-hidden="true" />
              )}
              Supprimer la publication
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>

      {/* Dialogue de modification - rendu en dehors du dropdown */}
      {canEdit && postAuthorId && (
        <EditPostDialog
          postId={postId}
          visibility={visibility}
          isAdult={isAdult}
          currentUser={currentUser}
          postAuthorId={postAuthorId}
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
        />
      )}

      {/* Dialogue de suppression - rendu en dehors du dropdown */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              {isAuthor ? (
                "Cette action ne peut pas être annulée. Cela supprimera définitivement votre publication."
              ) : (
                <>
                  <span className="font-medium text-amber-600 dark:text-amber-400">
                    Action administrateur :
                  </span>{" "}
                  Vous êtes sur le point de supprimer la publication d&apos;un
                  autre utilisateur. Cette action ne peut pas être annulée.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={deleteHandler} disabled={isPending}>
              {isPending ? (
                <LoaderCircle className="animate-spin" aria-hidden="true" />
              ) : (
                "Supprimer"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialogue de confirmation pour le remplacement du post épinglé */}
      <AlertDialog open={showMaxPinnedDialog} onOpenChange={setShowMaxPinnedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Limite atteinte</AlertDialogTitle>
            <AlertDialogDescription>
              Vous avez déjà 3 publications épinglées. Si vous continuez,
              la plus ancienne sera automatiquement désépinglée pour faire
              place à cette publication.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handlePinToggle(true)}
              disabled={isPinPending}
            >
              {isPinPending ? (
                <LoaderCircle className="animate-spin" aria-hidden="true" />
              ) : (
                "Remplacer"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialogue de signalement - rendu en dehors du dropdown */}
      {!isAuthor && !isAdmin && (
        <ReportDialog
          reportedPostId={postId}
          reportedUserId={postAuthorId}
          type="post"
          isOpen={showReportDialog}
          onClose={() => setShowReportDialog(false)}
        />
      )}
    </DropdownMenu>
  )
}
