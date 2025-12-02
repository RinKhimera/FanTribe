"use client"

import { useMutation } from "convex/react"
import { Flag } from "lucide-react"
import { useState, useTransition } from "react"
import { toast } from "sonner"
// import { sendReportEmail } from "@/actions/send-report-email"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
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
import { logger } from "@/lib/config/logger"
import { DropdownMenuItem } from "../ui/dropdown-menu"

interface ReportDialogProps {
  reportedUserId?: Id<"users">
  reportedPostId?: Id<"posts">
  reportedCommentId?: Id<"comments">
  type: "user" | "post" | "comment"
  triggerText?: string
  username?: string
}

export const ReportDialog = ({
  reportedUserId,
  reportedPostId,
  reportedCommentId,
  type,
  triggerText = "Signaler",
  username,
}: ReportDialogProps) => {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [description, setDescription] = useState("")
  const [isPending, startTransition] = useTransition()

  const createReport = useMutation(api.reports.createReport)

  const reasons = [
    { value: "spam", label: "Spam" },
    { value: "harassment", label: "Harcèlement" },
    { value: "inappropriate_content", label: "Contenu inapproprié" },
    { value: "fake_account", label: "Faux compte" },
    { value: "copyright", label: "Violation de droits d'auteur" },
    { value: "violence", label: "Violence" },
    { value: "hate_speech", label: "Discours de haine" },
    { value: "other", label: "Autre" },
  ]

  const handleSubmit = () => {
    if (!reason) {
      toast.error("Veuillez sélectionner un motif de signalement")
      return
    }

    startTransition(async () => {
      try {
        await createReport({
          reportedUserId,
          reportedPostId,
          reportedCommentId,
          type,
          reason: reason as any,
          description: description || undefined,
        })

        // await sendReportEmail({
        //   reportType: type,
        //   reason,
        //   description,
        //   reporterUsername: currentUser?.username!,
        //   reportedUsername: username,
        //   reportedContent: reportedPostId ? "Post content here" : undefined,
        // })

        toast.success("Signalement envoyé", {
          description:
            "Votre signalement a été transmis à nos équipes de modération.",
        })

        setOpen(false)
        setReason("")
        setDescription("")
      } catch (error) {
        logger.error("Failed to create report", error, { type, reason })
        toast.error("Erreur lors du signalement", {
          description: "Une erreur s'est produite. Veuillez réessayer.",
        })
      }
    })
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
        return "Aidez-nous à maintenir une communauté sûre en signalant les comportements inappropriés."
      case "post":
        return "Aidez-nous à maintenir une communauté sûre en signalant les publications inappropriées."
      case "comment":
        return "Aidez-nous à maintenir une communauté sûre en signalant les commentaires inappropriés."
      default:
        return "Aidez-nous à maintenir une communauté sûre."
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <DropdownMenuItem
          variant="destructive"
          onSelect={(e) => e.preventDefault()}
        >
          <Flag className="mr-2 size-4" />
          {triggerText}
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{getDialogTitle()}</DialogTitle>
          <DialogDescription>{getDialogDescription()}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="reason">Motif du signalement *</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un motif" />
              </SelectTrigger>
              <SelectContent>
                {reasons.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">Description (optionnel)</Label>
            <Textarea
              id="description"
              placeholder="Décrivez le problème en détail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1"
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isPending || !reason}
              className="flex-1"
            >
              {isPending ? "Envoi..." : "Signaler"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
