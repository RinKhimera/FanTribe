"use client"

import { useMutation } from "convex/react"
import { Globe, Loader2, Settings, User } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState, useTransition } from "react"
import { toast } from "sonner"
import {
  StepAbout,
  StepIdentity,
  StepPreferences,
} from "@/components/onboarding"
import { Step1Payload } from "@/components/onboarding/step-identity"
import { StepConfig, Stepper } from "@/components/shared/stepper"
import { api } from "@/convex/_generated/api"
import { useCurrentUser } from "@/hooks/useCurrentUser"
import { stepSlideVariants } from "@/lib/animations"
import {
  detectPlatform,
  extractUsername,
  isValidUrl,
  normalizeUrl,
} from "@/lib/social-links"
import { OnboardingStep2Data, OnboardingStep3Data } from "@/schemas/profile"

// ─── Config ───────────────────────────────────────────────────────────────────

const ONBOARDING_STEPS: StepConfig[] = [
  { title: "Identité", icon: User },
  { title: "À propos", icon: Globe },
  { title: "Préférences", icon: Settings },
]

// Max ms to wait for Convex user doc after Clerk signup
const WEBHOOK_TIMEOUT_MS = 15_000

// ─── Page ─────────────────────────────────────────────────────────────────────

const OnboardingPage = () => {
  const router = useRouter()
  const { currentUser, isLoading, isAuthenticated } = useCurrentUser()
  const [isPending, startTransition] = useTransition()

  const [currentStep, setCurrentStep] = useState(1)
  const [[, direction], setPage] = useState([1, 0])

  // Race condition guard: Clerk redirects before the webhook creates the Convex user doc
  const webhookStartRef = useRef(Date.now())
  const [webhookTimedOut, setWebhookTimedOut] = useState(false)

  // Prevents the resume-logic useEffect from redirecting to "/" while step 3 is
  // finishing (Convex reactive update fires before router.push("/welcome") runs)
  const isFinishingOnboarding = useRef(false)

  useEffect(() => {
    // Only run while authenticated but user doc not yet created
    if (!isAuthenticated || currentUser !== null) return
    const elapsed = Date.now() - webhookStartRef.current
    const remaining = WEBHOOK_TIMEOUT_MS - elapsed
    if (remaining <= 0) {
      setWebhookTimedOut(true)
      return
    }
    const timer = setTimeout(() => setWebhookTimedOut(true), remaining)
    return () => clearTimeout(timer)
  }, [isAuthenticated, currentUser])

  const updateOnboarding = useMutation(api.users.updateOnboardingProfile)
  const updateProfileImage = useMutation(api.users.updateProfileImage)

  // ── Navigation ───────────────────────────────────────────────────────────

  const goToStep = (step: number) => {
    const newDirection = step > currentStep ? 1 : -1
    setPage([step, newDirection])
    setCurrentStep(step)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  // ── Resume logic: if user has username but no onboardingCompleted, resume at step 2 ──

  useEffect(() => {
    if (!currentUser) return
    if (currentUser.onboardingCompleted && currentUser.username) {
      // Skip redirect if we're in the middle of finishing onboarding —
      // handleStep3 will navigate to /welcome itself
      if (!isFinishingOnboarding.current) {
        router.push("/")
      }
      return
    }
    if (
      currentUser.username &&
      !currentUser.onboardingCompleted &&
      currentStep === 1
    ) {
      setPage([2, 1])
      setCurrentStep(2)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.username, currentUser?.onboardingCompleted])

  // ── Step 1 handler ───────────────────────────────────────────────────────

  const handleStep1 = (data: Step1Payload) =>
    new Promise<void>((resolve, reject) => {
      startTransition(async () => {
        try {
          if (data._avatarUrl) {
            await updateProfileImage({
              imgUrl: data._avatarUrl,
            })
          }
          await updateOnboarding({
            username: data.username,
            displayName: data.displayName,
          })
          goToStep(2)
          resolve()
        } catch {
          toast.error("Erreur lors de l'enregistrement", {
            description: "Veuillez vérifier votre connexion et réessayer.",
          })
          reject()
        }
      })
    })

  // ── Step 2 handler ───────────────────────────────────────────────────────

  const handleStep2 = (data: OnboardingStep2Data) =>
    new Promise<void>((resolve, reject) => {
      startTransition(async () => {
        try {
          const hasSomeData =
            (data.bio && data.bio.trim()) ||
            (data.location && data.location.trim()) ||
            (data.socialLinks && data.socialLinks.length > 0)

          if (hasSomeData) {
            const socialLinks = (data.socialLinks || [])
              .map((l) => {
                const url = l.url?.trim()
                if (!url) return null
                const normalizedUrl = normalizeUrl(url)
                if (!isValidUrl(normalizedUrl)) return null
                const platform = detectPlatform(normalizedUrl)
                const username = extractUsername(normalizedUrl, platform)
                return { url: normalizedUrl, platform, username }
              })
              .filter((l): l is NonNullable<typeof l> => l !== null)

            await updateOnboarding({
              bio: data.bio?.trim() || undefined,
              location: data.location?.trim() || undefined,
              socialLinks: socialLinks.length ? socialLinks : undefined,
            })
          }

          goToStep(3)
          resolve()
        } catch {
          toast.error("Erreur lors de l'enregistrement", {
            description: "Veuillez vérifier votre connexion et réessayer.",
          })
          reject()
        }
      })
    })

  // ── Step 3 handler ───────────────────────────────────────────────────────

  const handleStep3 = (data: OnboardingStep3Data) =>
    new Promise<void>((resolve, reject) => {
      startTransition(async () => {
        try {
          isFinishingOnboarding.current = true
          await updateOnboarding({
            allowAdultContent: data.allowAdultContent,
            onboardingCompleted: true,
          })
          router.push("/welcome")
          resolve()
        } catch {
          toast.error("Erreur lors de la finalisation", {
            description: "Veuillez vérifier votre connexion et réessayer.",
          })
          reject()
        }
      })
    })

  const handleSkipStep2 = () => goToStep(3)

  const handleSkipStep3 = () => {
    startTransition(async () => {
      try {
        isFinishingOnboarding.current = true
        await updateOnboarding({ onboardingCompleted: true })
      } finally {
        router.push("/welcome")
      }
    })
  }

  // ── Loading states ────────────────────────────────────────────────────────

  if (isLoading || (isAuthenticated && currentUser === undefined)) {
    return (
      <OnboardingShell>
        <LoadingScreen message="Préparation de votre profil…" />
      </OnboardingShell>
    )
  }

  // Authenticated but Convex user doc not yet created (webhook delay)
  if (isAuthenticated && currentUser === null) {
    if (webhookTimedOut) {
      return (
        <OnboardingShell>
          <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
            <p className="text-muted-foreground text-lg">
              Erreur de chargement du profil.
            </p>
            <button
              onClick={() => {
                webhookStartRef.current = Date.now()
                setWebhookTimedOut(false)
              }}
              className="btn-premium cursor-pointer rounded-xl px-6 py-2 font-semibold"
            >
              Réessayer
            </button>
          </div>
        </OnboardingShell>
      )
    }
    return (
      <OnboardingShell>
        <LoadingScreen message="Création de votre compte en cours…" />
      </OnboardingShell>
    )
  }

  if (!currentUser) return null

  return (
    <OnboardingShell>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight max-sm:text-xl">
          Finalisation de votre profil
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {currentStep === 1 && "Choisissez votre identité sur la plateforme."}
          {currentStep === 2 &&
            "Parlez un peu de vous — modifiable à tout moment."}
          {currentStep === 3 &&
            "Quelques préférences pour personnaliser votre expérience."}
        </p>
      </div>

      {/* Stepper */}
      <Stepper steps={ONBOARDING_STEPS} currentStep={currentStep} />

      {/* Step content with directional slide animation */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={currentStep}
          custom={direction}
          variants={stepSlideVariants}
          initial="enter"
          animate="center"
          exit="exit"
        >
          {currentStep === 1 && (
            <StepIdentity
              currentUser={currentUser}
              onNext={handleStep1}
              isSubmitting={isPending}
            />
          )}
          {currentStep === 2 && (
            <StepAbout
              currentUser={currentUser}
              onNext={handleStep2}
              onSkip={handleSkipStep2}
              isSubmitting={isPending}
            />
          )}
          {currentStep === 3 && (
            <StepPreferences
              currentUser={currentUser}
              onFinish={handleStep3}
              onSkip={handleSkipStep3}
              isSubmitting={isPending}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </OnboardingShell>
  )
}

// ─── Shell layout (hors AppLayout) ────────────────────────────────────────────

const OnboardingShell = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen">
    <div className="container mx-auto max-w-2xl px-4 py-8">{children}</div>
  </div>
)

const LoadingScreen = ({ message }: { message: string }) => (
  <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
    <Loader2 className="text-primary h-12 w-12 animate-spin" />
    <p className="text-muted-foreground text-lg">{message}</p>
  </div>
)

export default OnboardingPage
