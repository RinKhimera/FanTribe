"use client"

import { useQuery } from "convex/react"
import { AnimatePresence, motion } from "motion/react"
import {
  ArrowRight,
  Flame,
  Loader2,
  Rss,
  SkipForward,
  TrendingUp,
  Users,
} from "lucide-react"
import { useState } from "react"
import { SuggestionCard } from "@/components/shared/suggestions/suggestion-card"
import { FormSection } from "@/components/shared/profile-form/form-section"
import { Button } from "@/components/ui/button"
import { api } from "@/convex/_generated/api"
import { Doc } from "@/convex/_generated/dataModel"
import { OnboardingStep3Data } from "@/schemas/profile"
import { cn } from "@/lib/utils"

interface StepPreferencesProps {
  currentUser: Doc<"users">
  onFinish: (data: OnboardingStep3Data) => Promise<void>
  onSkip: () => void
  isSubmitting: boolean
}

type UserIntent = "fan" | "creator"

const intentOptions: {
  value: UserIntent
  icon: React.ElementType
  label: string
  description: string
}[] = [
  {
    value: "fan",
    icon: Rss,
    label: "Découvrir du contenu",
    description: "Explorer les créateurs et accéder à des contenus exclusifs",
  },
  {
    value: "creator",
    icon: TrendingUp,
    label: "Partager et monétiser",
    description: "Créer du contenu et gagner de l'argent avec vos abonnés",
  },
]

export const StepPreferences = ({
  currentUser,
  onFinish,
  onSkip,
  isSubmitting,
}: StepPreferencesProps) => {
  const [selectedIntent, setSelectedIntent] = useState<UserIntent | null>(null)
  const [adultContent, setAdultContent] = useState(
    currentUser.allowAdultContent ?? false,
  )

  const suggestedCreators = useQuery(api.users.getSuggestedCreators, {})

  const onSubmit = async () => {
    await onFinish({
      userIntent: selectedIntent ?? undefined,
      allowAdultContent: adultContent,
    })
  }

  return (
    <div className="space-y-4">
      {/* Intent selection */}
      <FormSection icon={<Users className="size-4" />} title="Votre profil" delay={0}>
        <p className="text-muted-foreground text-sm">
          Qu&apos;est-ce qui vous amène sur FanTribe ?
        </p>
        <div className="grid grid-cols-2 gap-3">
          {intentOptions.map(({ value, icon: Icon, label, description }) => {
            const isSelected = selectedIntent === value
            return (
              <motion.button
                key={value}
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedIntent(value)}
                className={cn(
                  "relative flex cursor-pointer flex-col gap-3 rounded-xl border p-4 text-left transition-all duration-200",
                  isSelected
                    ? "border-primary bg-primary/10 shadow-[0_0_0_2px_var(--primary)]"
                    : "border-border bg-muted/30 hover:bg-muted/60",
                )}
              >
                <div
                  className={cn(
                    "flex size-10 items-center justify-center rounded-xl transition-colors",
                    isSelected ? "bg-primary text-primary-foreground" : "bg-muted",
                  )}
                >
                  <Icon className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{label}</p>
                  <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
                    {description}
                  </p>
                </div>

                {isSelected && (
                  <motion.div
                    layoutId="intent-indicator"
                    className="bg-primary absolute top-3 right-3 size-2 rounded-full"
                  />
                )}
              </motion.button>
            )
          })}
        </div>
      </FormSection>

      {/* Adult content toggle */}
      <FormSection icon={<Flame className="size-4" />} title="Contenu adulte" delay={0.08}>
        <button
          type="button"
          onClick={() => setAdultContent((v) => !v)}
          className={cn(
            "group relative w-full overflow-hidden",
            "flex cursor-pointer items-center justify-between gap-4 rounded-xl border p-4",
            "transition-all duration-300 focus-visible:outline-none",
            adultContent
              ? "border-orange-500/30 bg-orange-500/5"
              : "border-border bg-muted/30 hover:bg-muted/50",
          )}
        >
          {adultContent && (
            <div className="from-orange-500/0 via-orange-500/10 to-orange-500/0 absolute inset-0 animate-pulse bg-linear-to-r" />
          )}

          <div className="relative flex flex-col items-start gap-0.5">
            <span className="font-medium">Afficher le contenu adulte</span>
            <span className="text-muted-foreground text-left text-sm">
              {adultContent
                ? "Le contenu +18 public apparaît dans votre fil"
                : "Le contenu +18 public est masqué de votre fil"}
            </span>
          </div>

          {/* Toggle */}
          <div className="relative shrink-0">
            <div
              className={cn(
                "relative h-7 w-12 rounded-full ring-1 ring-inset transition-all duration-300",
                adultContent
                  ? "bg-orange-500 ring-orange-600/20"
                  : "bg-muted ring-border",
              )}
            >
              {adultContent && (
                <div className="absolute inset-0 rounded-full bg-orange-500 opacity-40 blur-md" />
              )}
              <div
                className={cn(
                  "absolute top-0.5 flex size-6 items-center justify-center rounded-full bg-white shadow-md transition-all duration-300",
                  adultContent ? "left-5.5" : "left-0.5",
                )}
              >
                <Flame
                  className={cn(
                    "size-3 transition-all duration-300",
                    adultContent ? "scale-110 text-orange-500" : "scale-90 text-muted-foreground/50",
                  )}
                />
              </div>
            </div>
          </div>
        </button>

        <p className="text-muted-foreground rounded-lg border border-border/50 bg-muted/50 px-3 py-2 text-xs leading-relaxed">
          En activant cette option, vous confirmez avoir 18 ans ou plus. Ce paramètre n&apos;affecte que le contenu public dans votre fil.
        </p>
      </FormSection>

      {/* Suggested creators */}
      <FormSection icon={<Users className="size-4" />} title="Créateurs à découvrir" delay={0.15}>
        <p className="text-muted-foreground text-sm">
          Explorez quelques créateurs populaires sur FanTribe
        </p>

        {suggestedCreators === undefined && (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="text-muted-foreground size-6 animate-spin" />
          </div>
        )}

        {suggestedCreators && suggestedCreators.length > 0 && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <AnimatePresence mode="popLayout">
              {suggestedCreators.slice(0, 4).map((creator, index) => (
                <SuggestionCard
                  key={creator._id}
                  user={creator}
                  variant="compact"
                  index={index}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        {suggestedCreators && suggestedCreators.length === 0 && (
          <p className="text-muted-foreground py-4 text-center text-sm">
            Aucun créateur disponible pour l&apos;instant.
          </p>
        )}
      </FormSection>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <Button
          type="button"
          variant="ghost"
          onClick={onSkip}
          disabled={isSubmitting}
          className="gap-2 text-muted-foreground"
        >
          <SkipForward className="size-4" />
          Passer
        </Button>

        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="btn-premium flex cursor-pointer items-center gap-2 rounded-xl px-8 py-2.5 font-semibold disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              <span>Finalisation…</span>
            </>
          ) : (
            <>
              <span>Terminer</span>
              <ArrowRight className="size-4" />
            </>
          )}
        </button>
      </div>
    </div>
  )
}
