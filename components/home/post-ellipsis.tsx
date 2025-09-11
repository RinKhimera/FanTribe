"use client"

import { useMutation } from "convex/react"
import {
  CheckCircle,
  Ellipsis,
  Globe,
  LoaderCircle,
  Lock,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { api } from "@/convex/_generated/api"
import { Doc, Id } from "@/convex/_generated/dataModel"

type PostEllipsisProps = {
  postId: Id<"posts">
  currentUser: Doc<"users">
  postAuthorId?: Id<"users">
  visibility?: "public" | "subscribers_only"
  postAuthorUsername?: string
}

export const PostEllipsis = ({
  postId,
  currentUser,
  postAuthorId,
  visibility = "public",
  postAuthorUsername,
}: PostEllipsisProps) => {
  const [isPending, startTransition] = useTransition()
  const [isUpdatePending, setIsUpdatePending] = useState(false)

  // Déterminer si l'utilisateur courant est l'auteur du post
  const isAuthor = postAuthorId === currentUser._id
  const canDelete = isAuthor || currentUser.accountType === "SUPERUSER"

  const deletePost = useMutation(api.posts.deletePost)
  const updatePostVisibility = useMutation(api.posts.updatePostVisibility)

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
        console.error(error)
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
        .catch((err) => {
          console.error("Erreur lors du partage:", err)
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

  const handleVisibilityChange = (
    newVisibility: "public" | "subscribers_only",
  ) => {
    if (newVisibility === visibility) return

    setIsUpdatePending(true)
    updatePostVisibility({
      postId,
      visibility: newVisibility,
    })
      .then(() => {
        toast.success("Visibilité modifiée", {
          description:
            newVisibility === "public"
              ? "Votre publication est maintenant visible par tous"
              : "Votre publication est maintenant réservée aux abonnés",
        })
      })
      .catch((error) => {
        console.error(error)
        toast.error("Erreur lors de la modification")
      })
      .finally(() => {
        setIsUpdatePending(false)
      })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
        <Button size="icon" variant="ghost">
          <Ellipsis />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64">
        {/* Option de visibilité - uniquement pour l'auteur */}
        {isAuthor && (
          <>
            <DropdownMenuLabel>Visibilité du post</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={visibility}
              onValueChange={(value) =>
                handleVisibilityChange(value as "public" | "subscribers_only")
              }
            >
              <DropdownMenuRadioItem value="public" disabled={isUpdatePending}>
                <Globe className="mr-2 size-4" />
                Public
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem
                value="subscribers_only"
                disabled={isUpdatePending}
              >
                <Lock className="mr-2 size-4" />
                Abonnés uniquement
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Option de partage (disponible pour tous) */}
        <DropdownMenuItem onClick={handleShareLink}>
          <Share2 className="mr-2 size-4" />
          Partager la publication
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {!isAuthor && (
            <>
              <ReportDialog
                reportedPostId={postId}
                reportedUserId={postAuthorId}
                type="post"
                triggerText="Signaler la publication"
              />
            </>
          )}
          {isAuthor && <EditPostDialog postId={postId} />}
          {canDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={(e) => e.preventDefault()}
                >
                  {isAuthor ? (
                    <Trash2 className="mr-2 size-4" />
                  ) : (
                    <Sparkles className="mr-2 size-4" />
                  )}
                  Supprimer la publication
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Êtes-vous absolument sûr ?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action ne peut pas être annulée. Cela supprimera
                    définitivement {isAuthor ? "votre" : "cette"} publication.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={deleteHandler}
                    disabled={isPending}
                  >
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
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
