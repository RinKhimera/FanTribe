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
    return <div className="text-muted-foreground p-4">Chargement…</div>
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
            "flex w-full items-center justify-between gap-4 rounded-xl p-4",
            "border transition-all duration-300",
            "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
            "cursor-pointer disabled:cursor-not-allowed disabled:opacity-70",
            "group relative overflow-hidden",
            adultContent
              ? "border-orange-500/30 bg-orange-500/5 focus-visible:ring-orange-500"
              : "border-border bg-muted/30 hover:bg-muted/50 focus-visible:ring-muted-foreground",
          )}
        >
          {/* Animated glow effect when active */}
          {adultContent && (
            <div className="absolute inset-0 animate-pulse bg-linear-to-r from-orange-500/0 via-orange-500/10 to-orange-500/0" />
          )}

          <div className="relative flex flex-col items-start gap-1">
            <span className="font-medium">Afficher le contenu adulte</span>
            <span className="text-muted-foreground text-left text-sm">
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
                <div className="absolute inset-0 rounded-full bg-orange-500 opacity-40 blur-md" />
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
                      ? "scale-110 text-orange-500"
                      : "text-muted-foreground/50 scale-90",
                  )}
                />
              </div>
            </div>
          </div>
        </button>

        {/* Info card */}
        <div className="bg-muted/50 border-border/50 flex gap-3 rounded-lg border p-3">
          <Flame className="mt-0.5 size-4 shrink-0 text-orange-500/70" />
          <p className="text-muted-foreground text-xs leading-relaxed">
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
              "flex w-full items-center justify-between rounded-lg border p-3 transition-all duration-300",
              "hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
              "cursor-pointer disabled:cursor-not-allowed disabled:opacity-70",
              "group relative overflow-hidden",
              currentLanguage === "fr"
                ? "border-primary bg-primary/10 focus-visible:ring-primary"
                : "border-border focus-visible:ring-muted-foreground",
            )}
          >
            {/* Subtle shine effect on selected */}
            {currentLanguage === "fr" && (
              <div className="from-primary/0 via-primary/5 to-primary/0 absolute inset-0 bg-linear-to-r opacity-50" />
            )}

            <div className="relative flex items-center gap-3">
              <span
                className="text-2xl"
                role="img"
                aria-label="Drapeau français"
              >
                🇫🇷
              </span>
              <span className="font-medium">Français</span>
            </div>

            {currentLanguage === "fr" && (
              <Check className="text-primary size-5 transition-transform duration-300 group-hover:scale-110" />
            )}
          </button>

          {/* Placeholder for future languages */}
          <div className="bg-muted/30 border-border/50 rounded-lg border border-dashed p-3">
            <p className="text-muted-foreground text-center text-xs">
              D&apos;autres langues seront bientôt disponibles
            </p>
          </div>
        </div>
      </FormSection>
    </div>
  )
}
