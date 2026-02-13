"use client"

import { UserProfile } from "@clerk/nextjs"
import { useMutation } from "convex/react"
import { Eye, Lock, MessageSquare } from "lucide-react"
import { useEffect, useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { FormSection } from "@/components/shared/profile-form/form-section"
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
    return <div className="p-4 text-muted-foreground">Chargement…</div>
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
              "w-full flex items-center justify-between gap-4 p-3 rounded-lg",
              "border transition-all duration-300",
              "hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary",
              "cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed",
              "group",
            )}
          >
            <div className="flex items-center gap-3 min-w-0">
              <Eye className="size-5 shrink-0 text-blue-500" />
              <div className="text-left min-w-0">
                <p className="font-medium">Profil privé</p>
                <p className="text-sm text-muted-foreground">
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
                  <div className="absolute inset-0 rounded-full bg-primary blur-sm opacity-30" />
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
              "w-full flex items-center justify-between gap-4 p-3 rounded-lg",
              "border transition-all duration-300",
              "hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary",
              "cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed",
              "group",
            )}
          >
            <div className="flex items-center gap-3 min-w-0">
              <MessageSquare className="size-5 shrink-0 text-purple-500" />
              <div className="text-left min-w-0">
                <p className="font-medium">Messages de tout le monde</p>
                <p className="text-sm text-muted-foreground">
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
                  <div className="absolute inset-0 rounded-full bg-primary blur-sm opacity-30" />
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
          <p className="text-sm text-muted-foreground leading-relaxed">
            Gérez la sécurité de votre compte : mot de passe, authentification
            à deux facteurs
          </p>

          <Dialog open={isClerkDialogOpen} onOpenChange={setIsClerkDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full sm:w-auto group relative overflow-hidden cursor-pointer"
              >
                {/* Subtle gradient on hover */}
                <div className="absolute inset-0 bg-linear-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <Lock className="mr-2 size-4 transition-transform group-hover:scale-110 duration-300" />
                <span className="relative">Gérer la sécurité du compte</span>
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-2xl overflow-hidden p-0">
              <VisuallyHidden>
                <DialogTitle>Sécurité du compte</DialogTitle>
              </VisuallyHidden>

              {/* Decorative gradient header */}
              <div className="absolute inset-x-0 top-0 h-32 bg-linear-to-b from-primary/5 via-primary/3 to-transparent pointer-events-none" />

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
