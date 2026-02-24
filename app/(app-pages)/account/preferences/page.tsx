"use client"

import { useMutation } from "convex/react"
import { Check, Flame, Globe } from "lucide-react"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { FormSection } from "@/components/shared/profile-form/form-section"
import { api } from "@/convex/_generated/api"
import { useCurrentUser } from "@/hooks"
import { cn } from "@/lib/utils"

export default function PreferencesPage() {
  const { currentUser } = useCurrentUser()
  const updateAdultContent = useMutation(api.users.updateAdultContentPreference)
  const updatePrivacy = useMutation(api.users.updatePrivacySettings)

  const [isPending, startTransition] = useTransition()
  const [adultContent, setAdultContent] = useState(
    currentUser?.allowAdultContent ?? false,
  )

  if (!currentUser) {
    return <div className="p-4 text-muted-foreground">Chargement…</div>
  }

  const currentLanguage = currentUser.privacySettings?.language ?? "fr"

  const handleAdultToggle = () => {
    const newValue = !adultContent
    setAdultContent(newValue)

    startTransition(async () => {
      try {
        await updateAdultContent({ allowAdultContent: newValue })
        toast.success(
          newValue ? "Contenu adulte activé" : "Contenu adulte désactivé",
        )
      } catch {
        // Revert on error
        setAdultContent(!newValue)
        toast.error("Erreur lors de la mise à jour")
      }
    })
  }

  const handleLanguageChange = (language: string) => {
    startTransition(async () => {
      try {
        await updatePrivacy({ language })
        toast.success("Langue mise à jour")
      } catch {
        toast.error("Erreur lors de la mise à jour")
      }
    })
  }

  return (
    <div className="space-y-6 p-4">
      {/* Adult Content Section */}
      <FormSection
        icon={<Flame className="size-5" />}
        title="Contenu adulte"
        delay={0}
      >
        <button
          type="button"
          onClick={handleAdultToggle}
          disabled={isPending}
          className={cn(
            "w-full flex items-center justify-between gap-4 p-4 rounded-xl",
            "border transition-all duration-300",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
            "cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed",
            "group relative overflow-hidden",
            adultContent
              ? "border-orange-500/30 bg-orange-500/5 focus-visible:ring-orange-500"
              : "border-border bg-muted/30 hover:bg-muted/50 focus-visible:ring-muted-foreground",
          )}
        >
          {/* Animated glow effect when active */}
          {adultContent && (
            <div className="absolute inset-0 bg-linear-to-r from-orange-500/0 via-orange-500/10 to-orange-500/0 animate-pulse" />
          )}

          <div className="relative flex flex-col items-start gap-1">
            <span className="font-medium">Afficher le contenu adulte</span>
            <span className="text-sm text-muted-foreground text-left">
              {adultContent
                ? "Le contenu +18 public apparaît dans votre fil"
                : "Le contenu +18 public est masqué de votre fil"}
            </span>
          </div>

          {/* Custom Toggle Switch */}
          <div className="relative shrink-0">
            <div
              className={cn(
                "relative h-7 w-12 rounded-full transition-all duration-300",
                "ring-1 ring-inset",
                adultContent
                  ? "bg-orange-500 ring-orange-600/20"
                  : "bg-muted ring-border",
              )}
            >
              {/* Glow effect when active */}
              {adultContent && (
                <div className="absolute inset-0 rounded-full bg-orange-500 blur-md opacity-40" />
              )}

              {/* Thumb */}
              <div
                className={cn(
                  "absolute top-0.5 size-6 rounded-full transition-all duration-300",
                  "bg-white shadow-md",
                  "flex items-center justify-center",
                  adultContent ? "left-5.5" : "left-0.5",
                )}
              >
                <Flame
                  className={cn(
                    "size-3 transition-all duration-300",
                    adultContent
                      ? "text-orange-500 scale-110"
                      : "text-muted-foreground/50 scale-90",
                  )}
                />
              </div>
            </div>
          </div>
        </button>

        {/* Info card */}
        <div className="flex gap-3 p-3 rounded-lg bg-muted/50 border border-border/50">
          <Flame className="size-4 text-orange-500/70 shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            En activant cette option, vous confirmez avoir 18 ans ou plus. Ce
            paramètre n&apos;affecte que le contenu public dans votre fil.
          </p>
        </div>
      </FormSection>

      {/* Language Section */}
      <FormSection
        icon={<Globe className="size-5" />}
        title="Langue"
        delay={0.1}
      >
        <div className="space-y-2">
          <button
            onClick={() => handleLanguageChange("fr")}
            disabled={isPending}
            className={cn(
              "w-full flex items-center justify-between p-3 rounded-lg border transition-all duration-300",
              "hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
              "cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed",
              "group relative overflow-hidden",
              currentLanguage === "fr"
                ? "border-primary bg-primary/10 focus-visible:ring-primary"
                : "border-border focus-visible:ring-muted-foreground",
            )}
          >
            {/* Subtle shine effect on selected */}
            {currentLanguage === "fr" && (
              <div className="absolute inset-0 bg-linear-to-r from-primary/0 via-primary/5 to-primary/0 opacity-50" />
            )}

            <div className="relative flex items-center gap-3">
              <span className="text-2xl" role="img" aria-label="Drapeau français">
                🇫🇷
              </span>
              <span className="font-medium">Français</span>
            </div>

            {currentLanguage === "fr" && (
              <Check className="size-5 text-primary transition-transform group-hover:scale-110 duration-300" />
            )}
          </button>

          {/* Placeholder for future languages */}
          <div className="p-3 rounded-lg bg-muted/30 border border-dashed border-border/50">
            <p className="text-xs text-muted-foreground text-center">
              D&apos;autres langues seront bientôt disponibles
            </p>
          </div>
        </div>
      </FormSection>
    </div>
  )
}
