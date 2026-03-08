"use client"

import { UserProfile } from "@clerk/nextjs"
import { useMutation } from "convex/react"
import { Eye, Lock, MessageSquare } from "lucide-react"
import { useEffect, useState, useTransition } from "react"
import { toast } from "sonner"
import { FormSection } from "@/components/shared/profile-form/form-section"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { VisuallyHidden } from "@/components/ui/visually-hidden"
import { api } from "@/convex/_generated/api"
import { useCurrentUser } from "@/hooks"
import { cn } from "@/lib/utils"

export default function SecurityPage() {
  const { currentUser } = useCurrentUser()
  const updatePrivacy = useMutation(api.users.updatePrivacySettings)

  const [isPending, startTransition] = useTransition()
  const [isClerkDialogOpen, setIsClerkDialogOpen] = useState(false)
  const [isPrivate, setIsPrivate] = useState(
    currentUser?.privacySettings?.profileVisibility === "private",
  )
  const [allowMessages, setAllowMessages] = useState(
    currentUser?.privacySettings?.allowMessagesFromNonSubscribers ?? true,
  )

  // Navigate to security section when Clerk dialog opens
  useEffect(() => {
    if (isClerkDialogOpen) {
      // Set hash to security section
      window.location.hash = "/security"
    } else {
      // Clean up hash when dialog closes
      if (window.location.hash === "#/security") {
        window.location.hash = ""
      }
    }
  }, [isClerkDialogOpen])

  if (!currentUser) {
    return <div className="text-muted-foreground p-4">Chargement…</div>
  }

  const handlePrivacyToggle = () => {
    const newValue = !isPrivate
    setIsPrivate(newValue)

    startTransition(async () => {
      try {
        await updatePrivacy({
          profileVisibility: newValue ? "private" : "public",
        })
        toast.success(newValue ? "Profil privé activé" : "Profil public activé")
      } catch {
        // Revert on error
        setIsPrivate(!newValue)
        toast.error("Erreur lors de la mise à jour")
      }
    })
  }

  const handleMessagesToggle = () => {
    const newValue = !allowMessages
    setAllowMessages(newValue)

    startTransition(async () => {
      try {
        await updatePrivacy({ allowMessagesFromNonSubscribers: newValue })
        toast.success("Préférence mise à jour")
      } catch {
        // Revert on error
        setAllowMessages(!newValue)
        toast.error("Erreur lors de la mise à jour")
      }
    })
  }

  return (
    <div className="space-y-6 p-4">
      {/* Privacy Toggles Section */}
      <FormSection
        icon={<Lock className="size-5" />}
        title="Confidentialité"
        delay={0}
      >
        <div className="space-y-3">
          {/* Profile Visibility Toggle */}
          <button
            type="button"
            onClick={handlePrivacyToggle}
            disabled={isPending}
            className={cn(
              "flex w-full items-center justify-between gap-4 rounded-lg p-3",
              "border transition-all duration-300",
              "hover:bg-muted/50 focus-visible:ring-primary focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
              "cursor-pointer disabled:cursor-not-allowed disabled:opacity-70",
              "group",
            )}
          >
            <div className="flex min-w-0 items-center gap-3">
              <Eye className="size-5 shrink-0 text-blue-500" />
              <div className="min-w-0 text-left">
                <p className="font-medium">Profil privé</p>
                <p className="text-muted-foreground text-sm">
                  Seuls vos abonnés peuvent voir votre profil
                </p>
              </div>
            </div>

            {/* Toggle Switch */}
            <div className="relative shrink-0">
              <div
                className={cn(
                  "relative h-6 w-11 rounded-full transition-all duration-300",
                  isPrivate ? "bg-primary" : "bg-muted",
                )}
              >
                {/* Subtle glow when active */}
                {isPrivate && (
                  <div className="bg-primary absolute inset-0 rounded-full opacity-30 blur-sm" />
                )}

                {/* Thumb */}
                <div
                  className={cn(
                    "absolute top-0.5 size-5 rounded-full transition-all duration-300",
                    "bg-white shadow-md",
                    isPrivate ? "left-5.5" : "left-0.5",
                  )}
                />
              </div>
            </div>
          </button>

          {/* Allow Messages Toggle */}
          <button
            type="button"
            onClick={handleMessagesToggle}
            disabled={isPending}
            className={cn(
              "flex w-full items-center justify-between gap-4 rounded-lg p-3",
              "border transition-all duration-300",
              "hover:bg-muted/50 focus-visible:ring-primary focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
              "cursor-pointer disabled:cursor-not-allowed disabled:opacity-70",
              "group",
            )}
          >
            <div className="flex min-w-0 items-center gap-3">
              <MessageSquare className="size-5 shrink-0 text-purple-500" />
              <div className="min-w-0 text-left">
                <p className="font-medium">Messages de tout le monde</p>
                <p className="text-muted-foreground text-sm">
                  Autoriser les messages des utilisateurs non-abonnés
                </p>
              </div>
            </div>

            {/* Toggle Switch */}
            <div className="relative shrink-0">
              <div
                className={cn(
                  "relative h-6 w-11 rounded-full transition-all duration-300",
                  allowMessages ? "bg-primary" : "bg-muted",
                )}
              >
                {/* Subtle glow when active */}
                {allowMessages && (
                  <div className="bg-primary absolute inset-0 rounded-full opacity-30 blur-sm" />
                )}

                {/* Thumb */}
                <div
                  className={cn(
                    "absolute top-0.5 size-5 rounded-full transition-all duration-300",
                    "bg-white shadow-md",
                    allowMessages ? "left-5.5" : "left-0.5",
                  )}
                />
              </div>
            </div>
          </button>
        </div>
      </FormSection>

      {/* Account Security Section */}
      <FormSection
        icon={<Lock className="size-5" />}
        title="Sécurité du compte"
        delay={0.1}
      >
        <div className="space-y-4">
          <p className="text-muted-foreground text-sm leading-relaxed">
            Gérez la sécurité de votre compte : mot de passe, authentification à
            deux facteurs
          </p>

          <Dialog open={isClerkDialogOpen} onOpenChange={setIsClerkDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="group relative w-full cursor-pointer overflow-hidden sm:w-auto"
              >
                {/* Subtle gradient on hover */}
                <div className="from-primary/0 via-primary/5 to-primary/0 absolute inset-0 bg-linear-to-r opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                <Lock className="mr-2 size-4 transition-transform duration-300 group-hover:scale-110" />
                <span className="relative">Gérer la sécurité du compte</span>
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-2xl overflow-hidden p-0">
              <VisuallyHidden>
                <DialogTitle>Sécurité du compte</DialogTitle>
              </VisuallyHidden>

              {/* Decorative gradient header */}
              <div className="from-primary/5 via-primary/3 pointer-events-none absolute inset-x-0 top-0 h-32 bg-linear-to-b to-transparent" />

              <div className="relative">
                <UserProfile
                  routing="hash"
                  appearance={{
                    elements: {
                      rootBox: "w-full",
                      card: "shadow-none border-none bg-transparent",
                      navbar: { display: "none" },
                      pageScrollBox: "p-0",
                    },
                  }}
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </FormSection>
    </div>
  )
}
