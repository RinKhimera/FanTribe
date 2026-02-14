"use client"

import { ArrowLeft, Camera, IdCard, Send } from "lucide-react"
import { motion } from "motion/react"
import { UseFormReturn } from "react-hook-form"
import { DocumentUploadSection } from "./document-upload-section"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { stepContentVariants, stepItemVariants } from "@/lib/animations"
import {
  ApplicationFormData,
  UploadedDocuments,
  motivationOptions,
} from "./types"

interface StepDocumentsProps {
  form: UseFormReturn<ApplicationFormData>
  userId: string
  uploadedDocuments: UploadedDocuments
  onUploadSuccess: (
    type: "identityCard" | "selfie",
    result: { url: string; mediaId: string; type: "image" | "video" },
  ) => void
  onRemoveDocument: (type: "identityCard" | "selfie") => void
  onPrevious: () => void
  onSubmit: () => void
  isSubmitting: boolean
}

export const StepDocuments = ({
  form,
  userId,
  uploadedDocuments,
  onUploadSuccess,
  onRemoveDocument,
  onPrevious,
  onSubmit,
  isSubmitting,
}: StepDocumentsProps) => {
  const selectedMotivation = form.watch("applicationReason")
  const documentsComplete =
    !!uploadedDocuments.identityCard && !!uploadedDocuments.selfie

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
        <div className="bg-primary/10 mx-auto mb-4 flex size-16 items-center justify-center rounded-full">
          <Camera className="text-primary size-8" />
        </div>
        <h2 className="mb-2 text-2xl font-bold">Documents & Motivation</h2>
        <p className="text-muted-foreground">
          Uploadez vos documents d&apos;identité et dites-nous pourquoi vous
          souhaitez devenir créateur
        </p>
      </motion.div>

      {/* Documents Upload */}
      <motion.div variants={stepItemVariants}>
        <Card className="glass-premium">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <IdCard className="text-primary size-5" />
              Vérification d&apos;identité
            </CardTitle>
            <CardDescription>
              Uploadez une photo de votre pièce d&apos;identité et un selfie
              vous tenant cette pièce
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Identity Card Upload */}
            <div>
              <Label className="mb-2 block text-sm font-medium">
                Pièce d&apos;identité (carte, passeport, permis)
              </Label>
              <div className="border-muted hover:border-primary/50 rounded-xl border-2 border-dashed p-6 text-center transition-colors">
                <DocumentUploadSection
                  type="identityCard"
                  uploadedDocument={uploadedDocuments.identityCard}
                  onUploadSuccess={(result) =>
                    onUploadSuccess("identityCard", result)
                  }
                  onRemove={() => onRemoveDocument("identityCard")}
                  userId={userId}
                  facingMode="environment"
                />
              </div>
            </div>

            {/* Selfie Upload */}
            <div>
              <Label className="mb-2 block text-sm font-medium">
                Selfie avec votre pièce d&apos;identité
              </Label>
              <div className="border-muted hover:border-primary/50 rounded-xl border-2 border-dashed p-6 text-center transition-colors">
                <DocumentUploadSection
                  type="selfie"
                  uploadedDocument={uploadedDocuments.selfie}
                  onUploadSuccess={(result) => onUploadSuccess("selfie", result)}
                  onRemove={() => onRemoveDocument("selfie")}
                  userId={userId}
                  facingMode="user"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Motivation Selection */}
      <motion.div variants={stepItemVariants}>
        <Card className="glass-premium">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Votre motivation</CardTitle>
            <CardDescription>
              Quelle est votre principale motivation pour devenir créateur ?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="applicationReason"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="grid gap-3"
                    >
                      {motivationOptions.map((option) => (
                        <motion.div
                          key={option.value}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          className={`flex cursor-pointer items-start space-x-3 rounded-lg border p-4 transition-colors ${
                            field.value === option.value
                              ? "border-(--gold-400) bg-(--gold-400)/5"
                              : "border-muted hover:border-primary/30 hover:bg-muted/30"
                          }`}
                          onPointerDown={() => field.onChange(option.value)}
                        >
                          <RadioGroupItem
                            value={option.value}
                            id={option.value}
                            className="mt-0.5"
                          />
                          <div className="grid flex-1 gap-1 leading-none">
                            <Label
                              htmlFor={option.value}
                              className="cursor-pointer text-sm font-medium"
                            >
                              {option.label}
                            </Label>
                            <p className="text-muted-foreground text-xs">
                              {option.description}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Custom reason field */}
            {selectedMotivation === "autre" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4"
              >
                <FormField
                  control={form.control}
                  name="customReason"
                  render={({ field }) => (
                    <FormItem>
                      <Label>Précisez votre motivation</Label>
                      <FormControl>
                        <Textarea
                          placeholder="Décrivez votre motivation spécifique..."
                          className="input-premium mt-2 min-h-20 resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </motion.div>
            )}
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
          onClick={onSubmit}
          disabled={isSubmitting || !documentsComplete}
          className="btn-premium flex-1 rounded-full"
        >
          {isSubmitting ? (
            <>
              <div className="mr-2 size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Soumission en cours...
            </>
          ) : (
            <>
              <Send className="mr-2 size-4" />
              Soumettre ma candidature
            </>
          )}
        </Button>
      </motion.div>

      {!documentsComplete && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-muted-foreground text-center text-sm"
        >
          Veuillez uploader les deux documents requis pour continuer
        </motion.p>
      )}
    </motion.div>
  )
}
