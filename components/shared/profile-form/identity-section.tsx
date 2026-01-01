"use client"

import { AnimatePresence, motion } from "motion/react"
import {
  AlertCircle,
  AtSign,
  CheckCircle2,
  Loader2,
  Sparkles,
  User,
} from "lucide-react"
import { UseFormReturn } from "react-hook-form"
import { z } from "zod"
import { FormSection } from "./form-section"
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { profileFormSchema } from "@/schemas/profile"

interface IdentitySectionProps {
  form: UseFormReturn<z.infer<typeof profileFormSchema>>
  watchUsername: string | undefined
  checkUsername: boolean | undefined
}

export const IdentitySection = ({
  form,
  watchUsername,
  checkUsername,
}: IdentitySectionProps) => {
  return (
    <FormSection icon={<User className="size-4" />} title="Identité" delay={0}>
      <FormField
        control={form.control}
        name="displayName"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-muted-foreground text-xs uppercase tracking-wide">
              Nom d&apos;affichage
            </FormLabel>
            <FormControl>
              <div className="relative">
                <Input
                  placeholder="Votre nom public"
                  className="glass-input rounded-xl border-0 pl-10"
                  {...field}
                />
                <Sparkles className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              </div>
            </FormControl>
            <FormDescription className="text-xs">
              Ce nom sera visible publiquement sur votre profil
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="username"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-muted-foreground text-xs uppercase tracking-wide">
              Identifiant
            </FormLabel>
            <FormControl>
              <div className="relative">
                <Input
                  placeholder="votre_identifiant"
                  className={cn(
                    "glass-input rounded-xl border-0 pl-10 pr-10",
                    checkUsername === false && "ring-destructive ring-2",
                    checkUsername === true && "ring-2 ring-emerald-500"
                  )}
                  {...field}
                />
                <AtSign className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                <div className="absolute top-1/2 right-3 -translate-y-1/2">
                  {watchUsername && watchUsername.length >= 6 && (
                    <AnimatePresence mode="wait">
                      {checkUsername === undefined ? (
                        <motion.div
                          key="loading"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                        >
                          <Loader2 className="text-muted-foreground size-4 animate-spin" />
                        </motion.div>
                      ) : checkUsername === true ? (
                        <motion.div
                          key="available"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                        >
                          <CheckCircle2 className="size-4 text-emerald-500" />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="taken"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                        >
                          <AlertCircle className="text-destructive size-4" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  )}
                </div>
              </div>
            </FormControl>
            <FormDescription className="text-xs">
              Votre identifiant unique (lettres minuscules, chiffres, _)
            </FormDescription>
            <FormMessage>
              {checkUsername === false && (
                <span className="text-destructive text-xs">
                  Cet identifiant est déjà pris
                </span>
              )}
            </FormMessage>
          </FormItem>
        )}
      />
    </FormSection>
  )
}
