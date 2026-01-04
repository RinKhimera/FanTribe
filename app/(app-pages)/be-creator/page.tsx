"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery } from "convex/react"
import { AnimatePresence, motion } from "motion/react"
import { useEffect, useRef, useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import {
  AlreadyCreator,
  ApplicationStatus,
  ApplicationStepper,
  applicationSchema,
  ApplicationFormData,
  motivationOptions,
  StepDocuments,
  StepIntroduction,
  StepPersonalInfo,
  UploadedDocument,
  UploadedDocuments,
} from "@/components/be-creator"
import { PageContainer } from "@/components/layout"
import { Form } from "@/components/ui/form"
import { api } from "@/convex/_generated/api"
import { useCurrentUser } from "@/hooks/useCurrentUser"
import { stepSlideVariants } from "@/lib/animations"
import { deleteBunnyAsset } from "@/lib/services/bunny"

const BeCreatorPage = () => {
  const { currentUser } = useCurrentUser()
  const [currentStep, setCurrentStep] = useState(1)
  const [[, direction], setPage] = useState([1, 0])
  const [isPending, startTransition] = useTransition()
  const [isValidating, setIsValidating] = useState(false)
  const [isReapplying, setIsReapplying] = useState(false)

  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocuments>(
    {}
  )

  // Convex mutations and queries
  const existingApplication = useQuery(
    api.creatorApplications.getUserApplication,
    currentUser ? { userId: currentUser._id } : "skip"
  )

  const submitApplication = useMutation(
    api.creatorApplications.submitApplication
  )
  const createDraftDocument = useMutation(
    api.validationDocuments.createDraftDocument
  )
  const deleteDraftDocument = useMutation(
    api.validationDocuments.deleteDraftDocument
  )

  // Refs for cleanup
  const isApplicationSubmittedRef = useRef(false)
  const uploadedDocumentsRef = useRef<UploadedDocuments>({})

  // Keep ref in sync
  useEffect(() => {
    uploadedDocumentsRef.current = uploadedDocuments
  }, [uploadedDocuments])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (!isApplicationSubmittedRef.current) {
        const currentDocs = uploadedDocumentsRef.current
        Object.values(currentDocs).forEach((doc) => {
          if (doc?.mediaId) {
            deleteBunnyAsset(doc.mediaId, "image").catch((error: unknown) => {
              console.error(
                "Erreur lors de la suppression du document:",
                error
              )
            })
            deleteDraftDocument({ mediaUrl: doc.mediaId }).catch(
              (error: unknown) => {
                console.error(
                  "Erreur lors de la suppression du brouillon:",
                  error
                )
              }
            )
          }
        })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Form setup
  const form = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      fullName: currentUser?.name || "",
      dateOfBirth: "",
      address: "",
      whatsappNumber: "",
      mobileMoneyNumber: "",
      mobileMoneyNumber2: "",
      applicationReason: undefined,
      customReason: "",
    },
    mode: "onChange",
  })

  // Update form default when user loads
  useEffect(() => {
    if (currentUser?.name && !form.getValues("fullName")) {
      form.setValue("fullName", currentUser.name)
    }
  }, [currentUser?.name, form])

  // Navigation helpers
  const goToStep = (step: number) => {
    const newDirection = step > currentStep ? 1 : -1
    setPage([step, newDirection])
    setCurrentStep(step)
  }

  const validateAndGoNext = async () => {
    setIsValidating(true)
    try {
      let isValid = true

      if (currentStep === 2) {
        isValid = await form.trigger([
          "fullName",
          "dateOfBirth",
          "address",
          "whatsappNumber",
          "mobileMoneyNumber",
          "mobileMoneyNumber2",
        ])
      }

      if (isValid) {
        goToStep(currentStep + 1)
      }
    } finally {
      setIsValidating(false)
    }
  }

  // Document upload handlers
  const handleUploadSuccess = (
    type: "identityCard" | "selfie",
    result: { url: string; mediaId: string; type: "image" | "video" }
  ) => {
    const uploadedDoc: UploadedDocument = {
      url: result.url,
      mediaId: result.mediaId,
      uploadedAt: Date.now(),
    }

    setUploadedDocuments((prev) => ({ ...prev, [type]: uploadedDoc }))

    if (currentUser) {
      createDraftDocument({
        userId: currentUser._id,
        mediaUrl: result.url,
        documentType: type === "identityCard" ? "identity_card" : "selfie",
      }).catch((error) => {
        console.error("Erreur lors de l'enregistrement du brouillon:", error)
      })
    }

    toast.success(
      `${type === "identityCard" ? "Pièce d'identité" : "Selfie"} ajouté`
    )
  }

  const handleRemoveDocument = async (type: "identityCard" | "selfie") => {
    const document = uploadedDocuments[type]
    if (!document) return

    try {
      await deleteBunnyAsset(document.mediaId, "image")
      await deleteDraftDocument({ mediaUrl: document.mediaId })
      setUploadedDocuments((prev) => ({
        ...prev,
        [type]: undefined,
      }))
      toast.success("Document supprimé")
    } catch (error) {
      console.error("Erreur lors de la suppression:", error)
      toast.error("Erreur lors de la suppression")
    }
  }

  // Form submission
  const handleSubmit = async () => {
    if (!currentUser) return

    // Validate form
    const isValid = await form.trigger()
    if (!isValid) {
      toast.error("Veuillez corriger les erreurs du formulaire")
      return
    }

    // Check documents
    if (!uploadedDocuments.identityCard || !uploadedDocuments.selfie) {
      toast.error("Veuillez uploader tous les documents requis")
      return
    }

    const data = form.getValues()

    // Validate custom reason
    if (data.applicationReason === "autre" && !data.customReason?.trim()) {
      toast.error("Veuillez préciser votre motivation")
      return
    }

    startTransition(async () => {
      try {
        const documents = [
          {
            type: "identity_card" as const,
            url: uploadedDocuments.identityCard!.url,
            publicId: uploadedDocuments.identityCard!.mediaId,
            uploadedAt: uploadedDocuments.identityCard!.uploadedAt,
          },
          {
            type: "selfie" as const,
            url: uploadedDocuments.selfie!.url,
            publicId: uploadedDocuments.selfie!.mediaId,
            uploadedAt: uploadedDocuments.selfie!.uploadedAt,
          },
        ]

        // Build final reason
        const finalReason =
          data.applicationReason === "autre"
            ? data.customReason
            : motivationOptions.find(
                (opt) => opt.value === data.applicationReason
              )?.label

        await submitApplication({
          userId: currentUser._id,
          personalInfo: {
            fullName: data.fullName,
            dateOfBirth: data.dateOfBirth,
            address: data.address,
            whatsappNumber: `+237${data.whatsappNumber}`,
            mobileMoneyNumber: `+237${data.mobileMoneyNumber}`,
            mobileMoneyNumber2: data.mobileMoneyNumber2
              ? `+237${data.mobileMoneyNumber2}`
              : undefined,
          },
          applicationReason: finalReason || "",
          identityDocuments: documents,
        })

        isApplicationSubmittedRef.current = true

        toast.success("Candidature soumise avec succès !", {
          description: "Nous examinerons votre demande sous 24-48h.",
        })

        // Move to step 4 (success state) or reload
        goToStep(4)

        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } catch (error) {
        console.error(error)
        toast.error("Erreur lors de la soumission", {
          description: "Veuillez réessayer plus tard.",
        })
      }
    })
  }

  // Loading state
  if (!currentUser) {
    return (
      <PageContainer
        title="Devenir Créateur"
        contentClassName="items-center justify-center"
      >
        <div className="flex flex-col items-center gap-4">
          <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <span className="text-muted-foreground">Chargement...</span>
        </div>
      </PageContainer>
    )
  }

  // Already a creator
  if (
    currentUser.accountType === "CREATOR" ||
    currentUser.accountType === "SUPERUSER"
  ) {
    return (
      <PageContainer title="Compte Créateur">
        <AlreadyCreator />
      </PageContainer>
    )
  }

  // Has existing application (and not reapplying)
  if (existingApplication && !isReapplying) {
    return (
      <PageContainer title="Devenir Créateur">
        <ApplicationStatus
          application={existingApplication}
          userId={currentUser._id}
          onReapplySuccess={() => {
            // Reset form and start fresh
            form.reset()
            setUploadedDocuments({})
            setCurrentStep(1)
            setPage([1, 0])
            setIsReapplying(true)
          }}
        />
      </PageContainer>
    )
  }

  // Render step content
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <StepIntroduction
            key="step-1"
            onNext={() => goToStep(2)}
          />
        )
      case 2:
        return (
          <StepPersonalInfo
            key="step-2"
            form={form}
            onNext={validateAndGoNext}
            onPrevious={() => goToStep(1)}
            isValidating={isValidating}
          />
        )
      case 3:
        return (
          <StepDocuments
            key="step-3"
            form={form}
            userId={currentUser._id}
            uploadedDocuments={uploadedDocuments}
            onUploadSuccess={handleUploadSuccess}
            onRemoveDocument={handleRemoveDocument}
            onPrevious={() => goToStep(2)}
            onSubmit={handleSubmit}
            isSubmitting={isPending}
          />
        )
      case 4:
        return (
          <motion.div
            key="step-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-12 text-center"
          >
            <div className="mb-4 flex size-20 items-center justify-center rounded-full bg-green-500/10">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 400 }}
              >
                <svg
                  className="size-10 text-green-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </motion.div>
            </div>
            <h2 className="mb-2 text-2xl font-bold text-gold-gradient">
              Candidature envoyée !
            </h2>
            <p className="text-muted-foreground">
              Vous recevrez une réponse sous 24-48h.
            </p>
          </motion.div>
        )
      default:
        return null
    }
  }

  return (
    <PageContainer title="Devenir Créateur">
      <div className="flex-1 overflow-hidden p-4 md:p-6">
        <div className="mx-auto max-w-2xl">
          {/* Stepper */}
          <ApplicationStepper currentStep={currentStep} />

          {/* Step Content with Animation */}
          <Form {...form}>
            <form onSubmit={(e) => e.preventDefault()}>
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={currentStep}
                  custom={direction}
                  variants={stepSlideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                >
                  {renderStep()}
                </motion.div>
              </AnimatePresence>
            </form>
          </Form>
        </div>
      </div>
    </PageContainer>
  )
}

export default BeCreatorPage
