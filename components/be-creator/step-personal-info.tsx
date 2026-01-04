"use client"

import { motion } from "motion/react"
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  MessageCircle,
  User,
  Wallet,
} from "lucide-react"
import { UseFormReturn } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DatePicker } from "@/components/ui/date-picker"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { stepContentVariants, stepItemVariants } from "@/lib/animations"
import { ApplicationFormData } from "./types"

interface StepPersonalInfoProps {
  form: UseFormReturn<ApplicationFormData>
  onNext: () => void
  onPrevious: () => void
  isValidating: boolean
}

export const StepPersonalInfo = ({
  form,
  onNext,
  onPrevious,
  isValidating,
}: StepPersonalInfoProps) => {
  return (
    <motion.div
      variants={stepContentVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={stepItemVariants} className="text-center">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-primary/10">
          <User className="size-8 text-primary" />
        </div>
        <h2 className="mb-2 text-2xl font-bold">Informations personnelles</h2>
        <p className="text-muted-foreground">
          Ces informations nous permettent de vérifier votre identité
        </p>
      </motion.div>

      {/* Form Card */}
      <motion.div variants={stepItemVariants}>
        <Card className="glass-premium">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="size-5 text-primary" />
              Vos coordonnées
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Full Name */}
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Nom complet (le nom sur votre pièce d&apos;identité)
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Entrez votre nom complet"
                      className="input-premium"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date of Birth */}
            <FormField
              control={form.control}
              name="dateOfBirth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date de naissance</FormLabel>
                  <FormControl>
                    <DatePicker
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Sélectionner votre date de naissance"
                      fromYear={1940}
                      toYear={new Date().getFullYear() - 18}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Address */}
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adresse complète</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Entrez votre adresse complète"
                      className="input-premium min-h-[80px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* WhatsApp Number */}
            <FormField
              control={form.control}
              name="whatsappNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <MessageCircle className="size-4 text-green-500" />
                    Numéro WhatsApp (pour contact)
                  </FormLabel>
                  <FormControl>
                    <div className="flex">
                      <div className="flex items-center rounded-l-md border border-r-0 border-input bg-muted/50 px-3 text-sm text-muted-foreground">
                        +237
                      </div>
                      <Input
                        placeholder="6XXXXXXXX"
                        className="input-premium !rounded-l-none"
                        maxLength={9}
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "")
                          field.onChange(value)
                        }}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Mobile Money Number */}
            <FormField
              control={form.control}
              name="mobileMoneyNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Wallet className="size-4 text-orange-500" />
                    Numéro Mobile Money (pour paiements)
                  </FormLabel>
                  <FormControl>
                    <div className="flex">
                      <div className="flex items-center rounded-l-md border border-r-0 border-input bg-muted/50 px-3 text-sm text-muted-foreground">
                        +237
                      </div>
                      <Input
                        placeholder="6XXXXXXXX"
                        className="input-premium !rounded-l-none"
                        maxLength={9}
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "")
                          field.onChange(value)
                        }}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Mobile Money Number 2 (Optional) */}
            <FormField
              control={form.control}
              name="mobileMoneyNumber2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Wallet className="size-4 text-orange-500/70" />
                    Numéro Mobile Money secondaire (optionnel)
                  </FormLabel>
                  <FormControl>
                    <div className="flex">
                      <div className="flex items-center rounded-l-md border border-r-0 border-input bg-muted/50 px-3 text-sm text-muted-foreground">
                        +237
                      </div>
                      <Input
                        placeholder="6XXXXXXXX"
                        className="input-premium !rounded-l-none"
                        maxLength={9}
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "")
                          field.onChange(value)
                        }}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Navigation Buttons */}
      <motion.div
        variants={stepItemVariants}
        className="flex items-center justify-between gap-4 pt-2"
      >
        <Button
          type="button"
          variant="outline"
          onClick={onPrevious}
          className="btn-premium-outline rounded-full px-6"
        >
          <ArrowLeft className="mr-2 size-4" />
          Retour
        </Button>
        <Button
          type="button"
          onClick={onNext}
          disabled={isValidating}
          className="btn-premium flex-1 rounded-full"
        >
          {isValidating ? (
            <>
              <div className="mr-2 size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Validation...
            </>
          ) : (
            <>
              Continuer
              <ArrowRight className="ml-2 size-4" />
            </>
          )}
        </Button>
      </motion.div>
    </motion.div>
  )
}
