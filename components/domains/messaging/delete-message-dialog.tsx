"use client"

import { useMutation } from "convex/react"
import { motion } from "motion/react"
import { AlertTriangle, Trash2 } from "lucide-react"
import { useState } from "react"
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
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"

type DeleteMessageDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  messageId: Id<"messages">
}

export const DeleteMessageDialog = ({
  open,
  onOpenChange,
  messageId,
}: DeleteMessageDialogProps) => {
  const [isPending, setIsPending] = useState(false)

  const deleteMessage = useMutation(api.messaging.deleteMessage)

  const handleDelete = async () => {
    setIsPending(true)
    try {
      await deleteMessage({ messageId })
      toast.success("Message supprimé")
      onOpenChange(false)
    } catch {
      toast.error("Erreur", {
        description: "Impossible de supprimer le message. Réessayez.",
      })
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/10 bg-black/95 backdrop-blur-xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-full bg-destructive/20">
              <Trash2 size={16} className="text-destructive" aria-hidden="true" />
            </div>
            Supprimer le message
          </DialogTitle>
          <DialogDescription className="pt-2">
            <div className="flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
              <AlertTriangle
                size={18}
                className="mt-0.5 shrink-0 text-amber-500"
                aria-hidden="true"
              />
              <div className="space-y-1 text-sm">
                <span className="block font-medium text-amber-500">
                  Cette action est irréversible
                </span>
                <span className="block text-muted-foreground">
                  Le message sera supprimé pour vous et pour l&apos;autre
                  participant. Un placeholder &quot;Message supprimé&quot; sera visible.
                </span>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 pt-4 sm:gap-0">
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
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
              className="gap-2"
            >
              {isPending ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="size-4 rounded-full border-2 border-white/30 border-t-white"
                />
              ) : (
                <>
                  <Trash2 size={16} />
                  Supprimer
                </>
              )}
            </Button>
          </motion.div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
