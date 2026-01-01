"use client"

import { AnimatePresence, motion } from "motion/react"
import { Globe, Link2, Plus, Trash2 } from "lucide-react"
import {
  UseFieldArrayReturn,
  UseFormReturn,
} from "react-hook-form"
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
import { profileFormSchema } from "@/schemas/profile"

interface LinksSectionProps {
  form: UseFormReturn<z.infer<typeof profileFormSchema>>
  fieldArray: UseFieldArrayReturn<z.infer<typeof profileFormSchema>, "urls", "id">
}

export const LinksSection = ({ form, fieldArray }: LinksSectionProps) => {
  const { fields, append, remove } = fieldArray

  return (
    <FormSection icon={<Link2 className="size-4" />} title="Liens" delay={0.2}>
      <FormDescription className="text-xs">
        Ajoutez des liens vers vos réseaux sociaux ou votre site web
      </FormDescription>

      <AnimatePresence mode="popLayout">
        {fields.map((field, index) => (
          <motion.div
            key={field.id}
            variants={itemVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            layout
          >
            <FormField
              control={form.control}
              name={`urls.${index}.value`}
              render={({ field: inputField }) => (
                <FormItem>
                  <div className="flex gap-2">
                    <FormControl>
                      <div className="relative flex-1">
                        <Input
                          {...inputField}
                          placeholder="https://..."
                          className="glass-input rounded-xl border-0 pl-10"
                        />
                        <Globe className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                      </div>
                    </FormControl>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                        className="hover:bg-destructive/10 hover:text-destructive size-10 rounded-xl"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </motion.div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </motion.div>
        ))}
      </AnimatePresence>

      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ value: "" })}
          className="glass-button w-full gap-2 rounded-xl"
        >
          <Plus className="size-4" />
          Ajouter un lien
        </Button>
      </motion.div>
    </FormSection>
  )
}
