"use client"

import { useMutation } from "convex/react"
import { Ban, Clock, Infinity as InfinityIcon, ShieldAlert } from "lucide-react"
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { useAsyncHandler } from "@/hooks"
import { cn } from "@/lib/utils"

interface BanUserDialogProps {
  userId: Id<"users">
  username?: string
  reportId?: Id<"reports">
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

const durationOptions = [
  { value: "1", label: "1 jour" },
  { value: "3", label: "3 jours" },
  { value: "7", label: "7 jours" },
  { value: "14", label: "14 jours" },
  { value: "30", label: "30 jours" },
  { value: "90", label: "90 jours" },
]

export const BanUserDialog = ({
  userId,
  username,
  reportId,
  isOpen,
  onClose,
  onSuccess,
}: BanUserDialogProps) => {
  const [banType, setBanType] = useState<"temporary" | "permanent">("temporary")
  const [durationDays, setDurationDays] = useState<string>("7")
  const [reason, setReason] = useState("")

  const banUser = useMutation(api.bans.banUser)

  const { execute, isPending } = useAsyncHandler({
    successMessage: "Utilisateur banni",
    successDescription: `${username ? `@${username}` : "L'utilisateur"} a été banni avec succès.`,
    errorMessage: "Erreur lors du bannissement",
    logContext: { userId, banType },
    onSuccess: () => {
      handleClose()
      onSuccess?.()
    },
  })

  const handleClose = () => {
    onClose()
    setTimeout(() => {
      setBanType("temporary")
      setDurationDays("7")
      setReason("")
    }, 200)
  }

  const handleSubmit = () => {
    if (!reason.trim()) return

    execute(() =>
      banUser({
        userId,
        banType,
        reason: reason.trim(),
        durationDays: banType === "temporary" ? parseInt(durationDays) : undefined,
        reportId,
      })
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-md overflow-hidden p-0">
        {/* Header with warning accent */}
        <div className="relative overflow-hidden border-b border-border/50 bg-gradient-to-br from-destructive/5 via-transparent to-transparent px-6 pt-6 pb-5">
          <div className="pointer-events-none absolute inset-0 opacity-30">
            <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-destructive/20 blur-3xl" />
          </div>

          <DialogHeader className="relative">
            <div className="mb-3 flex items-center gap-3">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-destructive/15 ring-1 ring-destructive/20"
              >
                <ShieldAlert className="h-5 w-5 text-destructive" />
              </motion.div>
              <div>
                <DialogTitle className="text-lg font-semibold">
                  Bannir {username ? `@${username}` : "l'utilisateur"}
                </DialogTitle>
                <DialogDescription className="mt-0.5 text-sm">
                  Cette action empêchera l&apos;utilisateur d&apos;accéder à la plateforme.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Content */}
        <div className="space-y-5 px-6 py-5">
          {/* Ban type selection */}
          <div>
            <Label className="mb-3 block text-sm font-medium">
              Type de bannissement
            </Label>
            <RadioGroup
              value={banType}
              onValueChange={(value) => setBanType(value as "temporary" | "permanent")}
              className="grid grid-cols-2 gap-3"
            >
              <Label
                htmlFor="temporary"
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-[border-color,background-color]",
                  banType === "temporary"
                    ? "border-amber-500/50 bg-amber-500/5"
                    : "border-border/60 bg-muted/30 hover:border-border hover:bg-muted/50"
                )}
              >
                <RadioGroupItem value="temporary" id="temporary" className="sr-only" />
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg",
                    banType === "temporary"
                      ? "bg-amber-500/20 text-amber-500"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">Temporaire</p>
                  <p className="text-xs text-muted-foreground">Durée limitée</p>
                </div>
              </Label>

              <Label
                htmlFor="permanent"
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-[border-color,background-color]",
                  banType === "permanent"
                    ? "border-destructive/50 bg-destructive/5"
                    : "border-border/60 bg-muted/30 hover:border-border hover:bg-muted/50"
                )}
              >
                <RadioGroupItem value="permanent" id="permanent" className="sr-only" />
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg",
                    banType === "permanent"
                      ? "bg-destructive/20 text-destructive"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <InfinityIcon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">Permanent</p>
                  <p className="text-xs text-muted-foreground">Définitif</p>
                </div>
              </Label>
            </RadioGroup>
          </div>

          {/* Duration selector (only for temporary) */}
          {banType === "temporary" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Label htmlFor="duration" className="mb-2 block text-sm font-medium">
                Durée du bannissement
              </Label>
              <Select value={durationDays} onValueChange={setDurationDays}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {durationOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </motion.div>
          )}

          {/* Reason */}
          <div>
            <Label htmlFor="reason" className="mb-2 block text-sm font-medium">
              Raison du bannissement <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="reason"
              placeholder="Décrivez la raison du bannissement…"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[100px] resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-border/50 bg-muted/20 px-6 py-4">
          <Button variant="ghost" onClick={handleClose} disabled={isPending}>
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={isPending || !reason.trim()}
            className="gap-2"
          >
            {isPending ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="h-4 w-4 rounded-full border-2 border-destructive-foreground/30 border-t-destructive-foreground"
                />
                Bannissement…
              </>
            ) : (
              <>
                <Ban className="h-4 w-4" />
                Bannir
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
