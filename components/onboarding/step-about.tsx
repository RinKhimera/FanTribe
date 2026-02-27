"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { AnimatePresence, motion } from "motion/react"
import {
  AlertCircle,
  ArrowRight,
  Check,
  Globe,
  Link2,
  Loader2,
  MapPin,
  Plus,
  SkipForward,
  Trash2,
} from "lucide-react"
import { useCallback } from "react"
import { useFieldArray, useForm } from "react-hook-form"
import { FormSection } from "@/components/shared/profile-form/form-section"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Doc } from "@/convex/_generated/dataModel"
import { itemVariants } from "@/lib/animations"
import {
  detectPlatform,
  extractUsername,
  isValidUrl,
  normalizeUrl,
} from "@/lib/social-links"
import { PLATFORM_CONFIG } from "@/lib/social-links/platform-config"
import { onboardingStep2Schema, OnboardingStep2Data } from "@/schemas/profile"
import { cn } from "@/lib/utils"

interface StepAboutProps {
  currentUser: Doc<"users">
  onNext: (data: OnboardingStep2Data) => Promise<void>
  onSkip: () => void
  isSubmitting: boolean
}

export const StepAbout = ({
  currentUser,
  onNext,
  onSkip,
  isSubmitting,
}: StepAboutProps) => {
  const form = useForm<OnboardingStep2Data>({
    resolver: zodResolver(onboardingStep2Schema),
    defaultValues: {
      bio: currentUser.bio || "",
      location: currentUser.location || "",
      socialLinks: currentUser.socialLinks?.map((l) => ({ url: l.url })) || [],
    },
  })

  const fieldArray = useFieldArray({
    name: "socialLinks",
    control: form.control,
  })
  const { fields, append, remove } = fieldArray

  const canAddMore = fields.length < 5

  const handleAddLink = useCallback(() => {
    if (canAddMore) append({ url: "" })
  }, [append, canAddMore])

  const onSubmit = async (data: OnboardingStep2Data) => {
    await onNext(data)
  }

  // eslint-disable-next-line react-hooks/incompatible-library -- React Hook Form's watch is intentional
  const bioValue = form.watch("bio") || ""

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

        {/* About section */}
        <FormSection icon={<Globe className="size-4" />} title="À propos" delay={0}>
          {/* Bio */}
          <FormField
            control={form.control}
            name="bio"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-muted-foreground text-xs uppercase tracking-wide">
                  Bio
                  <span className="text-muted-foreground/60 ml-1">(optionnel)</span>
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Parlez de vous en quelques mots…"
                    className="glass-input min-h-24 resize-none rounded-xl border-0"
                    {...field}
                  />
                </FormControl>
                <FormDescription className="text-xs">
                  {bioValue.length}/150 caractères
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Location */}
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-muted-foreground text-xs uppercase tracking-wide">
                  Localisation
                  <span className="text-muted-foreground/60 ml-1">(optionnel)</span>
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      placeholder="Douala, Cameroun"
                      className="glass-input rounded-xl border-0 pl-10"
                      autoComplete="address-level2"
                      {...field}
                    />
                    <MapPin className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </FormSection>

        {/* Social links */}
        <FormSection icon={<Link2 className="size-4" />} title="Liens sociaux" delay={0.1}>
          <FormDescription className="text-muted-foreground text-xs">
            Ajoutez jusqu&apos;à 5 liens vers vos réseaux sociaux ({fields.length}/5)
          </FormDescription>

          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {fields.map((field, index) => (
                <SocialLinkRow
                  key={field.id}
                  form={form}
                  index={index}
                  onRemove={() => remove(index)}
                />
              ))}
            </AnimatePresence>

            {canAddMore && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddLink}
                  className="glass-button w-full gap-2 rounded-xl border-dashed"
                >
                  <Plus className="size-4" />
                  Ajouter un lien social
                </Button>
              </motion.div>
            )}
          </div>
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
            Passer cette étape
          </Button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-premium flex cursor-pointer items-center gap-2 rounded-xl px-8 py-2.5 font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Enregistrement…</span>
              </>
            ) : (
              <>
                <span>Continuer</span>
                <ArrowRight className="size-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </Form>
  )
}

// ─── Social Link Row ──────────────────────────────────────────────────────────

interface SocialLinkRowProps {
  form: ReturnType<typeof useForm<OnboardingStep2Data>>
  index: number
  onRemove: () => void
}

const SocialLinkRow = ({ form, index, onRemove }: SocialLinkRowProps) => {
  const url = form.watch(`socialLinks.${index}.url`) ?? ""
  const hasUrl = url.trim().length > 0
  const isValid = hasUrl && isValidUrl(url)
  const platform = isValid ? detectPlatform(url) : "other"
  const username = isValid ? extractUsername(url, platform) : undefined
  const config = PLATFORM_CONFIG[platform] || PLATFORM_CONFIG.other
  const Icon = config.icon

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value.trim()
    if (value && !value.startsWith("http://") && !value.startsWith("https://")) {
      const normalized = normalizeUrl(value)
      if (normalized !== value) {
        form.setValue(`socialLinks.${index}.url`, normalized)
      }
    }
  }

  return (
    <motion.div
      variants={itemVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      layout
      className="space-y-1.5"
    >
      <FormField
        control={form.control}
        name={`socialLinks.${index}.url`}
        render={({ field }) => (
          <FormItem>
            <div className="flex gap-2">
              <FormControl>
                <div className="relative flex-1">
                  {/* Platform icon */}
                  <div
                    className={cn(
                      "absolute left-3 top-1/2 z-10 flex -translate-y-1/2 items-center justify-center rounded-lg p-1.5 transition-colors duration-200",
                      isValid ? config.bgColor : "bg-muted/50",
                    )}
                  >
                    <Icon
                      className={cn(
                        "size-4 transition-colors duration-200",
                        isValid ? config.color : "text-muted-foreground",
                      )}
                    />
                  </div>

                  <Input
                    {...field}
                    value={field.value || ""}
                    placeholder={config.placeholder}
                    className="glass-input rounded-xl border-0 pl-14 pr-10"
                    autoComplete="url"
                    onBlur={(e) => {
                      field.onBlur()
                      handleBlur(e)
                    }}
                  />

                  {/* Validation indicator */}
                  <AnimatePresence mode="wait">
                    {hasUrl && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                      >
                        {isValid ? (
                          <div className="rounded-full bg-emerald-500/10 p-1">
                            <Check className="size-3.5 text-emerald-500" />
                          </div>
                        ) : (
                          <div className="rounded-full bg-destructive/10 p-1">
                            <AlertCircle className="text-destructive size-3.5" />
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </FormControl>

              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={onRemove}
                  className="hover:bg-destructive/10 hover:text-destructive size-10 rounded-xl transition-colors"
                  aria-label="Supprimer le lien"
                >
                  <Trash2 className="size-4" />
                </Button>
              </motion.div>
            </div>

            {/* Platform detection */}
            <AnimatePresence>
              {isValid && platform !== "other" && (
                <motion.div
                  initial={{ opacity: 0, y: -8, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -8, height: 0 }}
                  className="flex items-center gap-1.5 overflow-hidden pl-1 pt-1"
                >
                  <span className={cn("text-xs font-medium", config.color)}>
                    {config.label}
                  </span>
                  {username && (
                    <>
                      <span className="text-muted-foreground text-xs">•</span>
                      <span className="text-muted-foreground text-xs font-medium">
                        {username}
                      </span>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <FormMessage />
          </FormItem>
        )}
      />
    </motion.div>
  )
}
