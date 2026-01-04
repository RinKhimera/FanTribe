"use client"

import { useMutation } from "convex/react"
import { AlertTriangle, ShieldOff, UserMinus } from "lucide-react"
import { motion } from "motion/react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { useAsyncHandler } from "@/hooks"

interface RevokeCreatorDialogProps {
  userId: Id<"users">
  username?: string
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export const RevokeCreatorDialog = ({
  userId,
  username,
  isOpen,
  onClose,
  onSuccess,
}: RevokeCreatorDialogProps) => {
  const [reason, setReason] = useState("")

  const revokeCreatorStatus = useMutation(
    api.creatorApplications.revokeCreatorStatus
  )

  const { execute, isPending } = useAsyncHandler({
    successMessage: "Statut créateur révoqué",
    successDescription: `${username ? `@${username}` : "L'utilisateur"} n'est plus créateur.`,
    errorMessage: "Erreur lors de la révocation",
    logContext: { userId },
    onSuccess: () => {
      handleClose()
      onSuccess?.()
    },
  })

  const handleClose = () => {
    onClose()
    setTimeout(() => setReason(""), 200)
  }

  const handleSubmit = () => {
    execute(() =>
      revokeCreatorStatus({
        userId,
        reason: reason.trim() || undefined,
      })
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-md overflow-hidden p-0">
        {/* Header with warning accent */}
        <div className="relative overflow-hidden border-b border-border/50 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent px-6 pt-6 pb-5">
          <div className="pointer-events-none absolute inset-0 opacity-40">
            <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-amber-500/30 blur-3xl" />
          </div>

          <DialogHeader className="relative">
            <div className="mb-3 flex items-center gap-3">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/15 ring-1 ring-amber-500/25"
              >
                <ShieldOff className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </motion.div>
              <div>
                <DialogTitle className="text-lg font-semibold">
                  Révoquer le statut créateur
                </DialogTitle>
                <DialogDescription className="mt-0.5 text-sm">
                  {username ? `@${username}` : "L'utilisateur"} perdra son
                  statut de créateur.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Content */}
        <div className="space-y-5 px-6 py-5">
          {/* Warning box */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Cette action retirera le statut créateur. L&apos;utilisateur ne
              pourra plus publier de contenu réservé aux abonnés ni recevoir de
              paiements.
            </p>
          </motion.div>

          {/* Reason textarea */}
          <div>
            <Label htmlFor="reason" className="mb-2 block text-sm font-medium">
              Raison (optionnel)
            </Label>
            <Textarea
              id="reason"
              placeholder="Raison de la révocation..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[80px] resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-border/50 bg-muted/20 px-6 py-4">
          <Button variant="ghost" onClick={handleClose} disabled={isPending}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending}
            className="gap-2 bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-700"
          >
            {isPending ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
                />
                Révocation...
              </>
            ) : (
              <>
                <UserMinus className="h-4 w-4" />
                Révoquer
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
