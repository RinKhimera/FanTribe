"use client"

import { useMutation, useQuery } from "convex/react"
import { Pencil } from "lucide-react"
import { useEffect, useEffectEvent, useState, useTransition } from "react"
import { toast } from "sonner"
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
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { logger } from "@/lib/config/logger"

interface EditPostDialogProps {
  postId: Id<"posts">
}

export const EditPostDialog = ({ postId }: EditPostDialogProps) => {
  const [open, setOpen] = useState(false)
  const [content, setContent] = useState("")
  const [isPending, startTransition] = useTransition()

  // Récupérer le post actuel pour pré-remplir le contenu
  // Utiliser "skip" quand le dialog est fermé pour éviter les requêtes inutiles
  const post = useQuery(api.posts.getPost, open ? { postId } : "skip")
  const updatePost = useMutation(api.posts.updatePost)

  // Utiliser useEffectEvent pour fermer le dialog si le post est supprimé
  const closeDialogIfDeleted = useEffectEvent(() => {
    setOpen(false)
    toast.error("Cette publication n'existe plus")
  })

  // Fermer le dialog si le post n'existe plus (supprimé)
  useEffect(() => {
    if (open && post === null) {
      closeDialogIfDeleted()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Pré-remplir le contenu quand le dialog s'ouvre
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (isOpen && post) {
      setContent(post.content)
    }
  }

  const handleSubmit = () => {
    if (!content.trim()) {
      toast.error("Le contenu ne peut pas être vide")
      return
    }

    startTransition(async () => {
      try {
        await updatePost({
          postId,
          content: content.trim(),
        })

        toast.success("Publication modifiée", {
          description: "Votre publication a été mise à jour avec succès.",
        })

        setOpen(false)
      } catch (error) {
        logger.error("Failed to update post", error, { postId })
        toast.error("Erreur lors de la modification", {
          description: "Une erreur s'est produite. Veuillez réessayer.",
        })
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <Pencil className="mr-2 size-4" />
          Modifier la publication
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Modifier la publication</DialogTitle>
          <DialogDescription>
            Modifiez le contenu de votre publication. Les médias ne peuvent pas
            être modifiés.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="content">Contenu de la publication *</Label>
            <Textarea
              id="content"
              placeholder="Que voulez-vous partager ?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="mt-1 min-h-[100px]"
              maxLength={500}
            />
            <div className="text-muted-foreground mt-1 text-right text-xs">
              {content.length}/500 caractères
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || !content.trim()}
          >
            {isPending ? "Modification..." : "Modifier"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
