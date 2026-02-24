"use client"

import { useMutation } from "convex/react"
import {
  AlertTriangle,
  Ban,
  Copyright,
  MessageSquareWarning,
  Shield,
  ShieldAlert,
  Skull,
  Sparkles,
  UserX,
} from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { useState } from "react"
import { toast } from "sonner"
import { sendReportEmail } from "@/actions/send-report-email"
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
import { useCurrentUser } from "@/hooks/useCurrentUser"
import { cn } from "@/lib/utils"

interface ReportDialogProps {
  reportedUserId?: Id<"users">
  reportedPostId?: Id<"posts">
  reportedCommentId?: Id<"comments">
  type: "user" | "post" | "comment"
  username?: string
  isOpen: boolean
  onClose: () => void
}

type ReportReason =
  | "spam"
  | "harassment"
  | "inappropriate_content"
  | "fake_account"
  | "copyright"
  | "violence"
  | "hate_speech"
  | "other"

const reasons: {
  value: ReportReason
  label: string
  description: string
  icon: typeof AlertTriangle
}[] = [
  {
    value: "spam",
    label: "Spam",
    description: "Publicité non sollicitée, liens suspects",
    icon: Ban,
  },
  {
    value: "harassment",
    label: "Harcèlement",
    description: "Intimidation, menaces, comportement abusif",
    icon: MessageSquareWarning,
  },
  {
    value: "inappropriate_content",
    label: "Contenu inapproprié",
    description: "Contenu choquant ou offensant",
    icon: ShieldAlert,
  },
  {
    value: "fake_account",
    label: "Faux compte",
    description: "Usurpation d'identité, compte frauduleux",
    icon: UserX,
  },
  {
    value: "copyright",
    label: "Droits d'auteur",
    description: "Contenu volé ou non autorisé",
    icon: Copyright,
  },
  {
    value: "violence",
    label: "Violence",
    description: "Contenu violent ou dangereux",
    icon: Skull,
  },
  {
    value: "hate_speech",
    label: "Discours de haine",
    description: "Discrimination, propos haineux",
    icon: AlertTriangle,
  },
  {
    value: "other",
    label: "Autre",
    description: "Autre problème à signaler",
    icon: Sparkles,
  },
]

const cardVariants = {
  initial: { opacity: 0, y: 16, scale: 0.95 },
  animate: (index: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      delay: index * 0.05,
      ease: [0.25, 0.1, 0.25, 1] as const,
    },
  }),
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.2 },
  },
}

const contentVariants = {
  initial: { opacity: 0, height: 0, marginTop: 0 },
  animate: {
    opacity: 1,
    height: "auto",
    marginTop: 16,
    transition: {
      duration: 0.35,
      ease: [0.25, 0.1, 0.25, 1] as const,
    },
  },
  exit: {
    opacity: 0,
    height: 0,
    marginTop: 0,
    transition: { duration: 0.25 },
  },
}

export const ReportDialog = ({
  reportedUserId,
  reportedPostId,
  reportedCommentId,
  type,
  username,
  isOpen,
  onClose,
}: ReportDialogProps) => {
  const [reason, setReason] = useState<ReportReason | "">("")
  const [description, setDescription] = useState("")
  const [isPending, setIsPending] = useState(false)

  const { currentUser } = useCurrentUser()
  const createReport = useMutation(api.reports.createReport)

  const handleClose = () => {
    onClose()
    // Delay reset to allow exit animation
    setTimeout(() => {
      setReason("")
      setDescription("")
    }, 200)
  }

  const handleSubmit = async () => {
    if (!reason) {
      toast.error("Veuillez sélectionner un motif de signalement")
      return
    }

    setIsPending(true)
    try {
      const result = await createReport({
        reportedUserId,
        reportedPostId,
        reportedCommentId,
        type,
        reason,
        description: description || undefined,
      })

      if (result.success) {
        // Fire-and-forget : notifier les admins par email
        sendReportEmail({
          reportType: type,
          reason,
          description: description || undefined,
          reporterUsername: currentUser?.username ?? "Utilisateur inconnu",
          reportedUsername: username,
        }).catch((err) => {
          console.error("Failed to send report notification email:", err)
        })

        toast.success("Signalement envoyé", {
          description: "Votre signalement a été transmis à nos équipes de modération.",
        })
        handleClose()
      } else if (result.duplicate) {
        toast.warning("Signalement déjà effectué", {
          description: result.message,
        })
        handleClose()
      }
    } catch {
      toast.error("Erreur lors du signalement", {
        description: "Veuillez réessayer plus tard.",
      })
    } finally {
      setIsPending(false)
    }
  }

  const getDialogTitle = () => {
    switch (type) {
      case "user":
        return `Signaler ${username ? `@${username}` : "cet utilisateur"}`
      case "post":
        return "Signaler cette publication"
      case "comment":
        return "Signaler ce commentaire"
      default:
        return "Signaler"
    }
  }

  const getDialogDescription = () => {
    switch (type) {
      case "user":
        return "Sélectionnez le motif qui correspond le mieux au comportement inapproprié."
      case "post":
        return "Sélectionnez le motif qui correspond le mieux au problème avec cette publication."
      case "comment":
        return "Sélectionnez le motif qui correspond le mieux au problème avec ce commentaire."
      default:
        return "Aidez-nous à maintenir une communauté sûre."
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-lg overflow-hidden p-0 sm:max-w-xl">
        {/* Header with gradient accent */}
        <div className="relative overflow-hidden border-b border-border/50 bg-gradient-to-br from-primary/5 via-transparent to-transparent px-6 pt-6 pb-5">
          {/* Subtle background pattern */}
          <div className="pointer-events-none absolute inset-0 opacity-30">
            <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-primary/20 blur-3xl" />
            <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-primary/10 blur-2xl" />
          </div>

          <DialogHeader className="relative">
            <div className="mb-3 flex items-center gap-3">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 15,
                  delay: 0.1,
                }}
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/20"
              >
                <Shield className="h-5 w-5 text-primary" />
              </motion.div>
              <div>
                <DialogTitle className="text-lg font-semibold tracking-tight">
                  {getDialogTitle()}
                </DialogTitle>
                <DialogDescription className="mt-0.5 text-sm text-muted-foreground">
                  {getDialogDescription()}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Content */}
        <div className="px-6 py-5">
          {/* Reason cards grid */}
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {reasons.map((r, index) => {
              const Icon = r.icon
              const isSelected = reason === r.value

              return (
                <motion.button
                  key={r.value}
                  variants={cardVariants}
                  initial="initial"
                  animate="animate"
                  custom={index}
                  onClick={() => setReason(r.value)}
                  className={cn(
                    "group relative flex items-start gap-3 rounded-xl p-3.5 text-left transition-all duration-200",
                    "border outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                    isSelected
                      ? "border-primary/50 bg-primary/8 shadow-[0_0_20px_-4px] shadow-primary/25"
                      : "border-border/60 bg-muted/30 hover:border-border hover:bg-muted/50"
                  )}
                >
                  {/* Selected indicator glow */}
                  {isSelected && (
                    <motion.div
                      layoutId="selectedGlow"
                      className="absolute inset-0 rounded-xl bg-primary/5"
                      initial={false}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}

                  {/* Icon */}
                  <div
                    className={cn(
                      "relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors duration-200",
                      isSelected
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground group-hover:bg-muted/80 group-hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4.5 w-4.5" />
                  </div>

                  {/* Text */}
                  <div className="relative min-w-0 flex-1">
                    <p
                      className={cn(
                        "text-sm font-medium transition-colors duration-200",
                        isSelected ? "text-primary" : "text-foreground"
                      )}
                    >
                      {r.label}
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                      {r.description}
                    </p>
                  </div>

                  {/* Checkmark */}
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 25 }}
                        className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary"
                      >
                        <svg
                          className="h-3 w-3 text-primary-foreground"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              )
            })}
          </div>

          {/* Description textarea - appears when reason is selected */}
          <AnimatePresence>
            {reason && (
              <motion.div
                variants={contentVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="overflow-hidden"
              >
                <Label
                  htmlFor="description"
                  className="text-sm font-medium text-foreground"
                >
                  Détails supplémentaires{" "}
                  <span className="font-normal text-muted-foreground">
                    (optionnel)
                  </span>
                </Label>
                <Textarea
                  id="description"
                  placeholder="Décrivez le problème en détail pour nous aider à mieux comprendre la situation..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-2 min-h-[100px] resize-none bg-muted/30 transition-colors focus:bg-muted/50"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer with actions */}
        <div className="flex items-center justify-end gap-3 border-t border-border/50 bg-muted/20 px-6 py-4">
          <Button
            variant="ghost"
            onClick={handleClose}
            disabled={isPending}
            className="px-5"
          >
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || !reason}
            className="min-w-[120px] gap-2 px-5"
          >
            {isPending ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground"
                />
                Envoi...
              </>
            ) : (
              <>
                <Shield className="h-4 w-4" />
                Signaler
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
