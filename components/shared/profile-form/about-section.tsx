"use client"

import { Globe, MapPin } from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"
import { profileFormSchema } from "@/schemas/profile"

interface AboutSectionProps {
  form: UseFormReturn<z.infer<typeof profileFormSchema>>
}

export const AboutSection = ({ form }: AboutSectionProps) => {
  return (
    <FormSection
      icon={<Globe className="size-4" />}
      title="À propos"
      delay={0.1}
    >
      <FormField
        control={form.control}
        name="bio"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-muted-foreground text-xs uppercase tracking-wide">
              Bio
            </FormLabel>
            <FormControl>
              <Textarea
                placeholder="Parlez de vous en quelques mots..."
                className="glass-input min-h-24 resize-none rounded-xl border-0"
                {...field}
              />
            </FormControl>
            <FormDescription className="text-xs">
              {field.value?.length || 0}/150 caractères
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="location"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-muted-foreground text-xs uppercase tracking-wide">
              Localisation
            </FormLabel>
            <FormControl>
              <div className="relative">
                <Input
                  placeholder="Paris, France"
                  className="glass-input rounded-xl border-0 pl-10"
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
  )
}
