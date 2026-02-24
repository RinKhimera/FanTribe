"use client"

import { AnimatePresence, motion } from "motion/react"
import { Check, AlertCircle, Link2, Plus, Trash2 } from "lucide-react"
import { useCallback } from "react"
import { UseFieldArrayReturn, UseFormReturn } from "react-hook-form"
import { z } from "zod"
import { FormSection } from "./form-section"
import { Button } from "@/components/ui/button"
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { itemVariants } from "@/lib/animations"
import {
  detectPlatform,
  extractUsername,
  isValidUrl,
  normalizeUrl,
} from "@/lib/social-links"
import { PLATFORM_CONFIG } from "@/lib/social-links/platform-config"
import { profileFormSchema } from "@/schemas/profile"
import { cn } from "@/lib/utils"

interface LinksSectionProps {
  form: UseFormReturn<z.infer<typeof profileFormSchema>>
  fieldArray: UseFieldArrayReturn<
    z.infer<typeof profileFormSchema>,
    "socialLinks",
    "id"
  >
}

const MAX_LINKS = 5

export const LinksSection = ({ form, fieldArray }: LinksSectionProps) => {
  const { fields, append, remove } = fieldArray
  const canAddMore = fields.length < MAX_LINKS

  const handleAddLink = useCallback(() => {
    if (canAddMore) {
      append({ url: "" })
    }
  }, [append, canAddMore])

  return (
    <FormSection
      icon={<Link2 className="size-4" />}
      title="Liens sociaux"
      delay={0.2}
    >
      <FormDescription className="text-muted-foreground text-xs">
        Ajoutez jusqu&apos;à {MAX_LINKS} liens vers vos réseaux sociaux (
        {fields.length}/{MAX_LINKS})
      </FormDescription>

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {fields.map((field, index) => (
            <SocialLinkInput
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
  )
}

// Individual social link input component
interface SocialLinkInputProps {
  form: UseFormReturn<z.infer<typeof profileFormSchema>>
  index: number
  onRemove: () => void
}

const SocialLinkInput = ({ form, index, onRemove }: SocialLinkInputProps) => {
  // Read URL from form - NO setValue in effects!
  const url = form.watch(`socialLinks.${index}.url`) ?? ""

  // DERIVED values - computed every render, no state needed
  const hasUrl = url.trim().length > 0
  const isValid = hasUrl && isValidUrl(url)
  const platform = isValid ? detectPlatform(url) : "other"
  const username = isValid ? extractUsername(url, platform) : undefined
  const config = PLATFORM_CONFIG[platform] || PLATFORM_CONFIG.other
  const Icon = config.icon

  // Normalize URL on blur (add https:// if missing)
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
                  {/* Platform icon indicator */}
                  <div
                    className={cn(
                      "absolute left-3 top-1/2 z-10 flex -translate-y-1/2 items-center justify-center rounded-lg p-1.5 transition-colors duration-200",
                      isValid ? config.bgColor : "bg-muted/50"
                    )}
                  >
                    <Icon
                      className={cn(
                        "size-4 transition-colors duration-200",
                        isValid ? config.color : "text-muted-foreground"
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
                          <motion.div
                            initial={{ rotate: -90 }}
                            animate={{ rotate: 0 }}
                            className="rounded-full bg-emerald-500/10 p-1"
                          >
                            <Check className="size-3.5 text-emerald-500" />
                          </motion.div>
                        ) : (
                          <motion.div className="rounded-full bg-destructive/10 p-1">
                            <AlertCircle className="text-destructive size-3.5" />
                          </motion.div>
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

            {/* Platform detection feedback */}
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
