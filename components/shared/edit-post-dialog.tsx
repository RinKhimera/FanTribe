"use client"

import { useMutation, useQuery } from "convex/react"
import { Flame, Globe, Info, Loader2, Lock, Pencil } from "lucide-react"
import { useEffect, useEffectEvent, useState } from "react"
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
import { Doc, Id } from "@/convex/_generated/dataModel"
import { useAsyncHandler } from "@/hooks"
import { cn } from "@/lib/utils"

interface EditPostDialogProps {
  postId: Id<"posts">
  visibility: "public" | "subscribers_only"
  isAdult?: boolean
  currentUser: Doc<"users">
  postAuthorId: Id<"users">
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export const EditPostDialog = ({
  postId,
  visibility: initialVisibility,
  isAdult: initialIsAdult,
  currentUser,
  postAuthorId,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
}: EditPostDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false)

  // Use external control if provided, otherwise internal
  const open = externalOpen ?? internalOpen
  const setOpen = externalOnOpenChange ?? setInternalOpen
  const [content, setContent] = useState("")
  const [visibility, setVisibility] = useState<"public" | "subscribers_only">(
    initialVisibility,
  )
  const [isAdult, setIsAdult] = useState(initialIsAdult ?? false)
  const [hasPreFilled, setHasPreFilled] = useState(false)

  // Permission checks
  const isOwner = currentUser._id === postAuthorId
  const isAdmin = currentUser.accountType === "SUPERUSER"
  const canEditContent = isOwner
  const canEditVisibility = isOwner

  // Fetch post data
  const post = useQuery(api.posts.getPost, open ? { postId } : "skip")
  const updatePost = useMutation(api.posts.updatePost)

  const { execute, isPending } = useAsyncHandler({
    successMessage: "Publication modifiée",
    successDescription: "Votre publication a été mise à jour avec succès.",
    errorMessage: "Erreur lors de la modification",
    errorDescription: "Une erreur s'est produite. Veuillez réessayer.",
    logContext: { postId },
    onSuccess: () => setOpen(false),
  })

  // Close dialog if post is deleted
  const closeDialogIfDeleted = useEffectEvent(() => {
    setOpen(false)
    toast.error("Cette publication n'existe plus")
  })

  // Use stable boolean for dependency (post === null means deleted, undefined means loading)
  const isPostDeleted = post === null

  useEffect(() => {
    if (open && isPostDeleted) {
      closeDialogIfDeleted()
    }
  }, [open, isPostDeleted])

  // Pre-fill values when post data arrives
  const postContent = post?.content
  const postVisibility = post?.visibility
  const postIsAdult = post?.isAdult

  useEffect(() => {
    if (open && post && !hasPreFilled) {
      setContent(post.content)
      setVisibility(post.visibility || "public")
      setIsAdult(post.isAdult ?? false)
      setHasPreFilled(true)
    }
    // Using primitive values to satisfy ESLint
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, hasPreFilled, postContent, postVisibility, postIsAdult])

  // Handle dialog open/close
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) {
      // Reset pre-fill flag when dialog closes
      setHasPreFilled(false)
    }
  }

  const handleSubmit = () => {
    // For admins, only send isAdult
    if (isAdmin && !isOwner) {
      execute(() =>
        updatePost({
          postId,
          isAdult,
        }),
      )
      return
    }

    // For owners, validate content and send all changes
    if (!content.trim()) {
      toast.error("Le contenu ne peut pas être vide")
      return
    }

    execute(() =>
      updatePost({
        postId,
        content: content.trim(),
        visibility,
        isAdult,
      }),
    )
  }

  // Check if anything has changed
  const hasChanges =
    (isOwner &&
      (content !== post?.content ||
        visibility !== (post?.visibility || "public"))) ||
    isAdult !== (post?.isAdult ?? false)

  // Check if externally controlled (no trigger needed)
  const isControlled = externalOpen !== undefined

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {!isControlled && (
        <DialogTrigger asChild>
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <Pencil className="mr-2 size-4" />
            Modifier la publication
          </DropdownMenuItem>
        </DialogTrigger>
      )}

      <DialogContent className="overflow-hidden p-0 sm:max-w-lg">
        {/* Header with gradient */}
        <div className="relative px-6 pt-6 pb-4">
          <div className="from-primary/5 pointer-events-none absolute inset-x-0 top-0 h-32 bg-linear-to-b to-transparent" />
          <DialogHeader className="relative">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <div className="bg-primary/10 flex size-9 items-center justify-center rounded-lg">
                <Pencil className="text-primary size-4" />
              </div>
              Modifier la publication
            </DialogTitle>
            <DialogDescription>
              {isAdmin && !isOwner
                ? "Modifiez le statut de contenu adulte de cette publication."
                : "Modifiez le contenu et les paramètres de votre publication."}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-5 px-6 pb-6">
          {/* Admin Warning Message */}
          {isAdmin && !isOwner && (
            <div className="flex gap-3 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3">
              <Info className="mt-0.5 size-4 shrink-0 text-amber-500" />
              <p className="text-sm text-amber-600 dark:text-amber-400">
                Seul le créateur peut modifier le contenu et la visibilité de
                cette publication.
              </p>
            </div>
          )}

          {/* Section 1: Content */}
          <div className="space-y-2">
            <Label
              htmlFor="content"
              className={cn(
                "text-sm font-medium",
                !canEditContent && "text-muted-foreground",
              )}
            >
              Contenu
            </Label>
            <div className="relative">
              <Textarea
                id="content"
                placeholder="Que voulez-vous partager ?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={!canEditContent}
                className={cn(
                  "min-h-30 resize-none transition-all duration-200",
                  "focus:ring-primary/20 focus:ring-2",
                  !canEditContent &&
                    "bg-muted/50 cursor-not-allowed opacity-60",
                )}
                maxLength={500}
              />
              <div
                className={cn(
                  "absolute right-3 bottom-2 text-xs tabular-nums",
                  content.length > 450
                    ? "text-orange-500"
                    : "text-muted-foreground",
                )}
              >
                {content.length}/500
              </div>
            </div>
          </div>

          {/* Section 2: Visibility */}
          <div className="space-y-2">
            <Label
              className={cn(
                "text-sm font-medium",
                !canEditVisibility && "text-muted-foreground",
              )}
            >
              Visibilité
            </Label>
            <div
              className={cn(
                "grid grid-cols-2 gap-2",
                !canEditVisibility && "pointer-events-none opacity-60",
              )}
            >
              {/* Public Option */}
              <button
                type="button"
                onClick={() => setVisibility("public")}
                disabled={!canEditVisibility}
                className={cn(
                  "relative flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-all duration-200",
                  "focus-visible:ring-primary focus-visible:ring-2 focus-visible:outline-none",
                  visibility === "public"
                    ? "border-green-500/50 bg-green-500/10"
                    : "border-border hover:border-muted-foreground/30 hover:bg-muted/50",
                )}
              >
                <div
                  className={cn(
                    "flex size-9 items-center justify-center rounded-lg transition-colors",
                    visibility === "public" ? "bg-green-500/20" : "bg-muted",
                  )}
                >
                  <Globe
                    className={cn(
                      "size-4 transition-colors",
                      visibility === "public"
                        ? "text-green-500"
                        : "text-muted-foreground",
                    )}
                  />
                </div>
                <div className="text-left">
                  <p
                    className={cn(
                      "text-sm font-medium",
                      visibility === "public" &&
                        "text-green-600 dark:text-green-400",
                    )}
                  >
                    Tout le monde
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Visible par tous
                  </p>
                </div>
                {/* Selection indicator */}
                {visibility === "public" && (
                  <div className="absolute top-2 right-2 size-2 rounded-full bg-green-500" />
                )}
              </button>

              {/* Subscribers Only Option */}
              <button
                type="button"
                onClick={() => setVisibility("subscribers_only")}
                disabled={!canEditVisibility}
                className={cn(
                  "relative flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-all duration-200",
                  "focus-visible:ring-primary focus-visible:ring-2 focus-visible:outline-none",
                  visibility === "subscribers_only"
                    ? "border-primary/50 bg-primary/10"
                    : "border-border hover:border-muted-foreground/30 hover:bg-muted/50",
                )}
              >
                <div
                  className={cn(
                    "flex size-9 items-center justify-center rounded-lg transition-colors",
                    visibility === "subscribers_only"
                      ? "bg-primary/20"
                      : "bg-muted",
                  )}
                >
                  <Lock
                    className={cn(
                      "size-4 transition-colors",
                      visibility === "subscribers_only"
                        ? "text-primary"
                        : "text-muted-foreground",
                    )}
                  />
                </div>
                <div className="text-left">
                  <p
                    className={cn(
                      "text-sm font-medium",
                      visibility === "subscribers_only" && "text-primary",
                    )}
                  >
                    Fans uniquement
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Réservé aux abonnés
                  </p>
                </div>
                {/* Selection indicator */}
                {visibility === "subscribers_only" && (
                  <div className="bg-primary absolute top-2 right-2 size-2 rounded-full" />
                )}
              </button>
            </div>
          </div>

          {/* Section 3: Adult Content Toggle */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Type de contenu</Label>
            <button
              type="button"
              onClick={() => setIsAdult(!isAdult)}
              className={cn(
                "flex w-full cursor-pointer items-center justify-between gap-4 rounded-xl border p-3 transition-all duration-200",
                "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
                isAdult
                  ? "border-orange-500/50 bg-orange-500/10 focus-visible:ring-orange-500"
                  : "border-border hover:border-muted-foreground/30 hover:bg-muted/50 focus-visible:ring-muted-foreground",
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex size-9 items-center justify-center rounded-lg transition-all duration-300",
                    isAdult ? "bg-orange-500/20" : "bg-muted",
                  )}
                >
                  <Flame
                    className={cn(
                      "size-4 transition-all duration-300",
                      isAdult
                        ? "text-orange-500 drop-shadow-[0_0_4px_rgba(249,115,22,0.5)]"
                        : "text-muted-foreground",
                    )}
                  />
                </div>
                <div className="text-left">
                  <p
                    className={cn(
                      "text-sm font-medium transition-colors",
                      isAdult && "text-orange-500",
                    )}
                  >
                    Contenu adulte (+18)
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {isAdult
                      ? "Ce contenu est marqué comme adulte"
                      : "Marquer comme contenu pour adultes"}
                  </p>
                </div>
              </div>

              {/* Custom Toggle Switch */}
              <div
                className={cn(
                  "relative h-6 w-11 shrink-0 rounded-full transition-all duration-300",
                  "ring-1 ring-inset",
                  isAdult
                    ? "bg-orange-500 ring-orange-600/20"
                    : "bg-muted ring-border",
                )}
              >
                {isAdult && (
                  <div className="absolute inset-0 rounded-full bg-orange-500 opacity-30 blur-md" />
                )}
                <div
                  className={cn(
                    "absolute top-0.5 size-5 rounded-full transition-all duration-300",
                    "bg-white shadow-md",
                    "flex items-center justify-center",
                    isAdult ? "left-5.5" : "left-0.5",
                  )}
                >
                  <Flame
                    className={cn(
                      "size-2.5 transition-colors duration-300",
                      isAdult ? "text-orange-500" : "text-muted-foreground/50",
                    )}
                  />
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="bg-muted/30 border-t px-6 py-4">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || !hasChanges}
            className={cn(
              "min-w-25",
              hasChanges && "bg-primary hover:bg-primary/90",
            )}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              "Enregistrer"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
