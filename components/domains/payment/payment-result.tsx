"use client"

import { useQuery } from "convex/react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import {
  AlertTriangle,
  CheckCircle,
  CreditCard,
  FlaskConical,
  Heart,
  Loader2,
  Smartphone,
  TestTube,
  XCircle,
} from "lucide-react"
import { type Variants, motion } from "motion/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { api } from "@/convex/_generated/api"
import { type Currency, formatCurrency } from "@/lib/formatters/currency"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PaymentResultProps {
  params: {
    status?: string
    username?: string
    reason?: string
    transaction?: string
    type?: string
    provider?: string
    session_id?: string
    code?: string
  }
  testMode: boolean
}

type PaymentState =
  | "success_subscription"
  | "success_tip"
  | "failed_cancelled"
  | "failed_error"

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

const containerVariants: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { staggerChildren: 0.09, delayChildren: 0.12 },
  },
}

const itemVariants: Variants = {
  initial: { opacity: 0, y: 14 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] },
  },
}

const iconSpring: Variants = {
  initial: { scale: 0, rotate: -24 },
  animate: {
    scale: 1,
    rotate: 0,
    transition: { delay: 0.15, type: "spring", stiffness: 260, damping: 20 },
  },
}

const ringPulse: Variants = {
  initial: { opacity: 0, scale: 0.8 },
  animate: {
    opacity: [0.35, 0.1, 0.35],
    scale: [1, 1.18, 1],
    transition: { duration: 3.2, repeat: Infinity, ease: "easeInOut" },
  },
}

const detailsReveal: Variants = {
  initial: { opacity: 0, height: 0 },
  animate: {
    opacity: 1,
    height: "auto",
    transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] },
  },
}

const lineReveal: Variants = {
  initial: { scaleX: 0 },
  animate: {
    scaleX: 1,
    transition: { delay: 0.55, duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
}

// ---------------------------------------------------------------------------
// State configuration
// ---------------------------------------------------------------------------

const STATE_CONFIG: Record<
  PaymentState,
  {
    icon: React.ElementType
    iconBg: string
    iconColor: string
    title: string
    accentGradient: string
    titleClass?: string
    ctaVariant?: string
  }
> = {
  success_subscription: {
    icon: CheckCircle,
    iconBg: "bg-green-500/10",
    iconColor: "text-green-500",
    title: "Abonnement activé !",
    accentGradient: "from-green-500/5 via-transparent to-transparent",
  },
  success_tip: {
    icon: Heart,
    iconBg: "bg-amber-500/10 dark:bg-amber-400/10",
    iconColor: "text-amber-500 dark:text-amber-400",
    title: "Pourboire envoyé !",
    accentGradient:
      "from-amber-500/5 via-transparent to-transparent dark:from-amber-400/5",
    titleClass: "text-gold-gradient",
    ctaVariant: "premium",
  },
  failed_cancelled: {
    icon: XCircle,
    iconBg: "bg-muted",
    iconColor: "text-muted-foreground",
    title: "Paiement annulé",
    accentGradient: "from-muted/30 via-transparent to-transparent",
  },
  failed_error: {
    icon: AlertTriangle,
    iconBg: "bg-destructive/10",
    iconColor: "text-destructive",
    title: "Paiement échoué",
    accentGradient: "from-destructive/5 via-transparent to-transparent",
  },
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const derivePaymentState = (params: PaymentResultProps["params"]): PaymentState => {
  if (params.status === "success") {
    return params.type === "tip" ? "success_tip" : "success_subscription"
  }
  return params.reason === "cancelled" ? "failed_cancelled" : "failed_error"
}

const getSubtitle = (
  state: PaymentState,
  reason?: string,
  code?: string,
): string => {
  switch (state) {
    case "success_subscription":
      return "Vous avez maintenant accès au contenu exclusif."
    case "success_tip":
      return "Votre générosité a été transmise au créateur."
    case "failed_cancelled":
      return "Vous avez annulé le paiement. Aucun montant n'a été débité."
    case "failed_error":
      switch (reason) {
        case "test_force_fail":
          return "Échec forcé en mode test."
        case "missing_transaction":
          return "Identifiant de transaction manquant."
        case "configuration_error":
          return "Erreur de configuration du service de paiement."
        case "payment_check_failed":
          return "Impossible de vérifier le statut du paiement."
        case "payment_failed":
          return code
            ? `Le paiement a été refusé (code\u00a0: ${code}).`
            : "Le paiement a été refusé par votre opérateur."
        case "unexpected_error":
          return "Une erreur inattendue est survenue. Veuillez réessayer."
        default:
          return "Une erreur est survenue lors du paiement. Veuillez réessayer."
      }
  }
}

const providerLabel = (provider: string): string => {
  switch (provider) {
    case "stripe":
      return "Carte bancaire"
    case "cinetpay":
      return "Mobile Money"
    case "test":
      return "Mode test"
    default:
      return provider
  }
}

const ProviderIcon = ({ provider }: { provider: string }) => {
  switch (provider) {
    case "stripe":
      return <CreditCard className="size-3.5" />
    case "cinetpay":
      return <Smartphone className="size-3.5" />
    case "test":
      return <TestTube className="size-3.5" />
    default:
      return null
  }
}

const getCtaLabel = (
  state: PaymentState,
  username?: string,
): string => {
  if (state === "failed_error") return "Retourner à l'accueil"
  return username
    ? `Retourner au profil de @${username}`
    : "Retourner à l'accueil"
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const PaymentResult = ({ params, testMode }: PaymentResultProps) => {
  const state = derivePaymentState(params)
  const config = STATE_CONFIG[state]
  const Icon = config.icon

  // Backend fetch (optional — only when CinetPay providerTransactionId is available)
  const canFetch = !!params.transaction && params.status === "success"
  const backendData = useQuery(
    api.transactions.getPaymentDetails,
    canFetch ? { providerTransactionId: params.transaction! } : "skip",
  )
  const isBackendLoading = canFetch && backendData === undefined
  const hasDetails = backendData !== undefined && backendData !== null && backendData.found

  const ctaHref =
    state === "failed_error" || !params.username
      ? "/"
      : `/${params.username}`
  const ctaText = getCtaLabel(state, params.username)

  return (
    <main className="flex min-h-screen w-full items-center justify-center border-l border-r border-muted px-4 py-12">
      <motion.div
        variants={containerVariants}
        initial="initial"
        animate="animate"
        className="w-full max-w-md"
      >
        {/* ---- Glass card ---- */}
        <motion.div
          variants={itemVariants}
          className="glass-premium relative overflow-hidden rounded-2xl p-8 text-center"
        >
          {/* Background accent gradient */}
          <div
            className={cn(
              "pointer-events-none absolute inset-0 bg-linear-to-br opacity-60",
              config.accentGradient,
            )}
          />

          {/* Decorative circles */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 0.06, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="absolute -right-10 -top-10 size-36 rounded-full border-2 border-current"
              style={{ color: "var(--primary)" }}
            />
            <motion.div
              initial={{ opacity: 0, rotate: 45, scale: 0.5 }}
              animate={{ opacity: 0.04, rotate: 45, scale: 1 }}
              transition={{ delay: 0.45, duration: 0.8 }}
              className="absolute -bottom-8 -left-8 size-24 border-2 border-current"
              style={{ color: "var(--primary)" }}
            />
          </div>

          <div className="relative flex flex-col items-center gap-6">
            {/* Test mode badge */}
            {testMode && (
              <motion.div
                variants={itemVariants}
                className="flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-sm font-medium text-amber-500"
              >
                <FlaskConical className="size-4" aria-hidden="true" />
                Paiement simulé (mode test)
              </motion.div>
            )}

            {/* Animated icon */}
            <motion.div variants={itemVariants} className="relative">
              {/* Pulsing ring */}
              <motion.div
                variants={ringPulse}
                className={cn(
                  "absolute inset-0 rounded-full",
                  config.iconBg,
                )}
                style={{ margin: "-8px" }}
              />
              {/* Icon circle */}
              <motion.div
                variants={iconSpring}
                className={cn(
                  "relative flex size-20 items-center justify-center rounded-full",
                  config.iconBg,
                )}
              >
                <Icon
                  className={cn("size-10", config.iconColor)}
                  strokeWidth={1.5}
                />
              </motion.div>
            </motion.div>

            {/* Title */}
            <motion.h1
              variants={itemVariants}
              className={cn(
                "text-2xl font-semibold tracking-tight",
                config.titleClass,
              )}
            >
              {config.title}
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={itemVariants}
              className="-mt-2 max-w-xs text-base text-muted-foreground"
            >
              {getSubtitle(state, params.reason, params.code)}
            </motion.p>

            {/* Transaction details */}
            {(hasDetails || isBackendLoading) && (
              <motion.div
                variants={detailsReveal}
                className="w-full overflow-hidden rounded-xl border border-border/50 bg-muted/30 backdrop-blur-sm"
              >
                {isBackendLoading ? (
                  <div className="flex items-center justify-center gap-2 px-5 py-4 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                    Traitement en cours…
                  </div>
                ) : hasDetails ? (
                  <div className="divide-y divide-border/50 text-sm">
                    {/* Amount */}
                    <div className="flex items-center justify-between px-5 py-3">
                      <span className="text-muted-foreground">Montant</span>
                      <span className="font-semibold">
                        {formatCurrency(
                          backendData.amount,
                          backendData.currency as Currency,
                        )}
                      </span>
                    </div>
                    {/* Provider */}
                    <div className="flex items-center justify-between px-5 py-3">
                      <span className="text-muted-foreground">
                        Moyen de paiement
                      </span>
                      <span className="flex items-center gap-1.5 font-medium">
                        <ProviderIcon provider={backendData.provider} />
                        {providerLabel(backendData.provider)}
                      </span>
                    </div>
                    {/* Date */}
                    <div className="flex items-center justify-between px-5 py-3">
                      <span className="text-muted-foreground">Date</span>
                      <span className="font-medium">
                        {format(
                          new Date(backendData.createdAt),
                          "d MMM yyyy 'à' HH:mm",
                          { locale: fr },
                        )}
                      </span>
                    </div>
                    {/* Creator */}
                    {backendData.creator && (
                      <div className="flex items-center justify-between px-5 py-3">
                        <span className="text-muted-foreground">Créateur</span>
                        <span className="font-medium">
                          {backendData.creator.username
                            ? `@${backendData.creator.username}`
                            : backendData.creator.name}
                        </span>
                      </div>
                    )}
                  </div>
                ) : null}
              </motion.div>
            )}

            {/* CTA */}
            <motion.div variants={itemVariants} className="w-full pt-2">
              <Button
                asChild
                className={cn(
                  "w-full",
                  config.ctaVariant === "premium" && "btn-premium",
                )}
                size="lg"
              >
                <Link href={ctaHref}>{ctaText}</Link>
              </Button>
            </motion.div>
          </div>
        </motion.div>

        {/* Decorative divider */}
        <motion.div
          variants={lineReveal}
          className="mx-auto mt-6 h-px w-24 bg-linear-to-r from-transparent via-border to-transparent"
        />
      </motion.div>
    </main>
  )
}
