"use client"

import { useMutation } from "convex/react"
import {
  Bell,
  DollarSign,
  Heart,
  Mail,
  MessageCircle,
  Star,
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
  | "messages"
  | "tips"

export default function NotificationsPage() {
  const { currentUser } = useCurrentUser()
  const updatePreferences = useMutation(api.users.updateNotificationPreferences)

  const [isPending, startTransition] = useTransition()
  const [localPrefs, setLocalPrefs] = useState(
    currentUser?.notificationPreferences || {},
  )

  if (!currentUser) {
    return <div className="p-4 text-muted-foreground">Chargement…</div>
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
      key: "messages" as NotificationKey,
      label: "Messages",
      description: "Notifications pour les nouveaux messages",
      icon: MessageCircle,
      iconColor: "text-purple-500",
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
                  "w-full flex items-center justify-between gap-4 p-3 rounded-lg",
                  "border transition-all duration-300",
                  "hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary",
                  "cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed",
                  "group",
                )}
                style={{
                  animationDelay: `${index * 50}ms`,
                }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className={cn("size-5 shrink-0", toggle.iconColor)} />
                  <div className="text-left min-w-0">
                    <p className="font-medium">{toggle.label}</p>
                    <p className="text-sm text-muted-foreground truncate">
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
                      <div className="absolute inset-0 rounded-full bg-primary blur-sm opacity-30" />
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
        <div className="p-4 rounded-lg bg-muted/30 border border-dashed border-border/50">
          <div className="flex items-center gap-3">
            <Mail className="size-5 text-muted-foreground shrink-0" />
            <p className="text-sm text-muted-foreground">
              Les notifications par email ne sont pas encore disponibles.
            </p>
          </div>
        </div>
      </FormSection>
    </div>
  )
}
