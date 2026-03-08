"use client"

import { useMutation } from "convex/react"
import {
  Bell,
  DollarSign,
  Heart,
  Mail,
  MessageCircle,
  Star,
  UserPlus,
} from "lucide-react"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { FormSection } from "@/components/shared/profile-form/form-section"
import { api } from "@/convex/_generated/api"
import { useCurrentUser } from "@/hooks"
import { cn } from "@/lib/utils"

type NotificationKey =
  | "likes"
  | "comments"
  | "newPosts"
  | "subscriptions"
  | "follows"
  | "tips"

export default function NotificationsPage() {
  const { currentUser } = useCurrentUser()
  const updatePreferences = useMutation(api.users.updateNotificationPreferences)

  const [isPending, startTransition] = useTransition()
  const [localPrefs, setLocalPrefs] = useState(
    currentUser?.notificationPreferences || {},
  )

  if (!currentUser) {
    return <div className="text-muted-foreground p-4">Chargement…</div>
  }

  const toggles = [
    {
      key: "likes" as NotificationKey,
      label: "J'aime",
      description: "Notifications quand quelqu'un aime votre contenu",
      icon: Heart,
      iconColor: "text-pink-500",
    },
    {
      key: "comments" as NotificationKey,
      label: "Commentaires",
      description: "Notifications pour les nouveaux commentaires",
      icon: MessageCircle,
      iconColor: "text-blue-500",
    },
    {
      key: "newPosts" as NotificationKey,
      label: "Nouvelles publications",
      description: "Notifications des créateurs que vous suivez",
      icon: Star,
      iconColor: "text-amber-500",
    },
    {
      key: "subscriptions" as NotificationKey,
      label: "Abonnements",
      description: "Notifications sur vos abonnements",
      icon: Bell,
      iconColor: "text-primary",
    },
    {
      key: "follows" as NotificationKey,
      label: "Nouveaux suiveurs",
      description: "Notifications quand quelqu'un vous suit",
      icon: UserPlus,
      iconColor: "text-violet-500",
    },
    {
      key: "tips" as NotificationKey,
      label: "Pourboires",
      description: "Notifications quand vous recevez un pourboire",
      icon: DollarSign,
      iconColor: "text-green-500",
    },
  ]

  const handleToggle = (key: NotificationKey) => {
    const currentValue = localPrefs[key] ?? true
    const newValue = !currentValue

    setLocalPrefs({ ...localPrefs, [key]: newValue })

    startTransition(async () => {
      try {
        await updatePreferences({ [key]: newValue })
        toast.success(newValue ? "Activé" : "Désactivé")
      } catch {
        // Revert on error
        setLocalPrefs({ ...localPrefs, [key]: currentValue })
        toast.error("Erreur lors de la mise à jour")
      }
    })
  }

  return (
    <div className="space-y-6 p-4">
      {/* App Notifications Section */}
      <FormSection
        icon={<Bell className="size-5" />}
        title="Notifications de l'application"
        delay={0}
      >
        <div className="space-y-3">
          {toggles.map((toggle, index) => {
            const Icon = toggle.icon
            const value = localPrefs[toggle.key] ?? true

            return (
              <button
                key={toggle.key}
                type="button"
                onClick={() => handleToggle(toggle.key)}
                disabled={isPending}
                className={cn(
                  "flex w-full items-center justify-between gap-4 rounded-lg p-3",
                  "border transition-all duration-300",
                  "hover:bg-muted/50 focus-visible:ring-primary focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
                  "cursor-pointer disabled:cursor-not-allowed disabled:opacity-70",
                  "group",
                )}
                style={{
                  animationDelay: `${index * 50}ms`,
                }}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Icon className={cn("size-5 shrink-0", toggle.iconColor)} />
                  <div className="min-w-0 text-left">
                    <p className="font-medium">{toggle.label}</p>
                    <p className="text-muted-foreground truncate text-sm">
                      {toggle.description}
                    </p>
                  </div>
                </div>

                {/* Toggle Switch */}
                <div className="relative shrink-0">
                  <div
                    className={cn(
                      "relative h-6 w-11 rounded-full transition-all duration-300",
                      value ? "bg-primary" : "bg-muted",
                    )}
                  >
                    {/* Subtle glow when active */}
                    {value && (
                      <div className="bg-primary absolute inset-0 rounded-full opacity-30 blur-sm" />
                    )}

                    {/* Thumb */}
                    <div
                      className={cn(
                        "absolute top-0.5 size-5 rounded-full transition-all duration-300",
                        "bg-white shadow-md",
                        value ? "left-5.5" : "left-0.5",
                      )}
                    />
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </FormSection>

      {/* Email Notifications Section */}
      <FormSection
        icon={<Mail className="size-5" />}
        title="Notifications par email"
        delay={0.1}
      >
        <div className="bg-muted/30 border-border/50 rounded-lg border border-dashed p-4">
          <div className="flex items-center gap-3">
            <Mail className="text-muted-foreground size-5 shrink-0" />
            <p className="text-muted-foreground text-sm">
              Les notifications par email ne sont pas encore disponibles.
            </p>
          </div>
        </div>
      </FormSection>
    </div>
  )
}
