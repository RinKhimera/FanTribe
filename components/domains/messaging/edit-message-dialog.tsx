"use client"

import { useMutation } from "convex/react"
import { motion } from "motion/react"
import { Clock, Pencil } from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"

type EditMessageDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  messageId: Id<"messages">
  currentContent: string
}

export const EditMessageDialog = ({
  open,
  onOpenChange,
  messageId,
  currentContent,
}: EditMessageDialogProps) => {
  const [content, setContent] = useState(currentContent)
  const [isPending, setIsPending] = useState(false)

  const editMessage = useMutation(api.messaging.editMessage)

  // Reset content when dialog opens
  useEffect(() => {
    if (open) {
      setContent(currentContent)
    }
  }, [open, currentContent])

  const handleSubmit = async () => {
    if (!content.trim() || content.trim() === currentContent.trim()) {
      onOpenChange(false)
      return
    }

    setIsPending(true)
    try {
      await editMessage({
        messageId,
        newContent: content.trim(),
      })
      toast.success("Message modifié")
      onOpenChange(false)
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erreur inconnue"

      if (
        errorMessage.includes("15 minutes") ||
        errorMessage.includes("délai")
      ) {
        toast.error("Délai dépassé", {
          description:
            "Vous ne pouvez modifier un message que dans les 15 minutes suivant son envoi.",
        })
      } else {
        toast.error("Erreur", {
          description: "Impossible de modifier le message. Réessayez.",
        })
      }
    } finally {
      setIsPending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/10 bg-black/95 backdrop-blur-xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-full bg-amber-500/20">
              <Pencil size={16} className="text-amber-500" aria-hidden="true" />
            </div>
            Modifier le message
          </DialogTitle>
          <DialogDescription className="flex items-center gap-1.5 text-muted-foreground">
            <Clock size={14} aria-hidden="true" />
            Modifiable pendant 15 minutes après l&apos;envoi
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Textarea
            aria-label="Modifier le message"
            name="editMessage"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Votre message…"
            className="min-h-[100px] resize-none border-white/10 bg-white/5 focus-visible:ring-amber-500/50"
            autoFocus
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Appuyez sur Entrée pour sauvegarder, Shift+Entrée pour un retour à
            la ligne
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            className="hover:bg-white/10"
          >
            Annuler
          </Button>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={handleSubmit}
              disabled={
                isPending ||
                !content.trim() ||
                content.trim() === currentContent.trim()
              }
              className="bg-gradient-to-r from-amber-500 to-orange-500 text-black hover:from-amber-400 hover:to-orange-400"
            >
              {isPending ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="size-4 rounded-full border-2 border-black/30 border-t-black"
                />
              ) : (
                "Sauvegarder"
              )}
            </Button>
          </motion.div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
