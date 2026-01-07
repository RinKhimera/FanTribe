"use client"

import { useQuery } from "convex/react"
import {
  Check,
  CreditCard,
  Crown,
  Gift,
  LoaderCircle,
  MessageCircle,
  Package,
  Shield,
  Smartphone,
  Star,
  X,
} from "lucide-react"
import { motion } from "motion/react"
import Image from "next/image"
import { useTransition } from "react"
import { toast } from "sonner"
import { startStripeCheckout } from "@/actions/stripe/checkout"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { api } from "@/convex/_generated/api"
import { Doc } from "@/convex/_generated/dataModel"
import { useCinetpayPayment } from "@/hooks/useCinetpayPayment"
import { logger } from "@/lib/config/logger"
import { formatCurrency } from "@/lib/formatters/currency"
import { cn } from "@/lib/utils"

type MessagingSubscriptionModalProps = {
  isOpen: boolean
  onClose: () => void
  creator: Doc<"users">
  currentUser: Doc<"users">
  onSuccess?: () => void
}

export const MessagingSubscriptionModal = ({
  isOpen,
  onClose,
  creator,
  currentUser,
  onSuccess,
}: MessagingSubscriptionModalProps) => {
  const { processPayment, isPending: isPaymentPending } = useCinetpayPayment()
  const [isStripePending, startStripeTransition] = useTransition()

  // Récupérer le statut des abonnements
  const subscriptionStatus = useQuery(
    api.subscriptions.getSubscriptionStatusForMessaging,
    { creatorId: creator._id },
  )

  const isPending = isPaymentPending || isStripePending
  const scenario = subscriptionStatus?.scenario ?? "both_missing"
  const prices = subscriptionStatus?.prices ?? {
    contentAccess: 1000,
    messagingAccess: 2000,
    bundle: 3500,
    bundleSavings: 1500,
  }

  // Handler pour le paiement CinetPay
  const handleCinetPayPayment = (type: "content" | "messaging" | "bundle") => {
    if (!currentUser || !creator) return

    const paymentConfig = {
      content: {
        amount: prices.contentAccess,
        description: `Abonnement Contenu - ${creator.username}`,
        action: "subscribe" as const,
        subscriptionType: "content_access",
      },
      messaging: {
        amount: prices.messagingAccess,
        description: `Abonnement Messagerie - ${creator.username}`,
        action: "subscribe" as const,
        subscriptionType: "messaging_access",
      },
      bundle: {
        amount: prices.bundle,
        description: `Pack Complet - ${creator.username}`,
        action: "subscribe" as const,
        subscriptionType: "bundle",
      },
    }

    const config = paymentConfig[type]

    processPayment({
      creatorId: creator._id,
      subscriberId: currentUser._id,
      creatorUsername: creator.username,
      amount: config.amount,
      description: config.description,
      customFields: {
        type: "subscription",
        action: config.action,
        subscriptionType: config.subscriptionType,
      },
    })
  }

  // Handler pour le paiement Stripe
  // Note: Stripe ne supporte actuellement que content_access (1000 XAF)
  // Pour messaging_access et bundle, utiliser CinetPay
  const handleStripePayment = async (
    type: "content" | "messaging" | "bundle",
  ) => {
    if (!currentUser || !creator) return

    // Stripe ne supporte que content_access pour le moment
    // Pour messaging et bundle, on redirige vers CinetPay
    if (type !== "content") {
      toast.info("Paiement par carte non disponible", {
        description: "Utilisez Orange/MTN Money pour cet abonnement.",
      })
      return
    }

    startStripeTransition(async () => {
      try {
        await startStripeCheckout({
          creatorId: creator._id as string,
          subscriberId: currentUser._id as string,
          creatorUsername: creator.username as string,
          action: "subscribe",
        })
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Erreur inconnue"

        logger.error("Stripe checkout failed", error, {
          creatorId: creator._id,
          subscriberId: currentUser._id,
          type,
        })

        toast.error("Impossible de démarrer le paiement", {
          description: errorMessage,
        })
      }
    })
  }

  // Contenu selon le scénario
  const getContent = () => {
    switch (scenario) {
      case "messaging_missing":
        return {
          title: "Abonnement Messagerie requis",
          description: `Pour envoyer des messages à ${creator.name}, vous devez avoir un abonnement Messagerie.`,
          price: prices.messagingAccess,
          duration: "2 semaines",
          paymentType: "messaging" as const,
          features: [
            { icon: MessageCircle, text: "Messagerie directe illimitée" },
            { icon: Star, text: "Notifications en temps réel" },
            { icon: Check, text: "Sans engagement" },
          ],
        }
      case "content_missing":
        return {
          title: "Abonnement Contenu requis",
          description: `Pour envoyer des messages à ${creator.name}, vous devez d'abord avoir un abonnement Contenu Exclusif.`,
          price: prices.contentAccess,
          duration: "1 mois",
          paymentType: "content" as const,
          features: [
            { icon: Star, text: "Accès au contenu exclusif" },
            { icon: Crown, text: "Publications réservées aux abonnés" },
            { icon: Check, text: "Sans engagement" },
          ],
          note: "L'abonnement Messagerie pourra être ajouté ensuite.",
        }
      case "both_missing":
      default:
        return {
          title: "Pack Complet recommandé",
          description: `Pour envoyer des messages à ${creator.name}, vous avez besoin de deux abonnements.`,
          price: prices.bundle,
          duration: "1 mois chaque",
          paymentType: "bundle" as const,
          features: [
            { icon: Star, text: "Contenu exclusif (1 mois)" },
            { icon: MessageCircle, text: "Messagerie directe (1 mois)" },
            { icon: Gift, text: `Économie de ${formatCurrency(prices.bundleSavings, "XAF")}` },
          ],
          isBundle: true,
        }
    }
  }

  const content = getContent()

  // Si les deux abonnements sont actifs, fermer la modale et créer la conversation
  if (scenario === "both_active") {
    onSuccess?.()
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm overflow-hidden border-primary/10 bg-background/95 p-0 shadow-2xl backdrop-blur-xl">
        {/* Header avec image de fond */}
        <div className="relative">
          <div className="h-32 overflow-hidden">
            <Image
              className="h-full w-full object-cover"
              src={
                creator.imageBanner ||
                "https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=800&dpr=2&q=80"
              }
              alt={creator.name}
              width={400}
              height={128}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-primary/10" />
          </div>

          {/* Bouton fermer */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute right-2 top-2 h-8 w-8 rounded-full bg-black/20 text-white hover:bg-black/40"
          >
            <X className="h-4 w-4" />
          </Button>

          {/* Avatar centré */}
          <motion.div
            className="absolute -bottom-12 left-1/2 -translate-x-1/2"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            <div className="relative">
              <div className="absolute inset-0 scale-110 rounded-full bg-primary/20 blur-xl" />
              <Avatar className="relative h-24 w-24 ring-4 ring-primary/40 ring-offset-2 ring-offset-background shadow-xl">
                <AvatarImage src={creator.image} className="object-cover" />
                <AvatarFallback className="bg-muted text-xl">
                  {creator.name?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>
              {content.isBundle && (
                <motion.div
                  className="absolute -bottom-1 -right-1 rounded-full bg-green-500 p-1.5 shadow-lg"
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Package className="h-4 w-4 text-white" />
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Contenu principal */}
        <div className="px-6 pb-6 pt-16">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <DialogTitle className="text-lg font-bold">
              {content.title}
            </DialogTitle>
            <DialogDescription className="mt-2 text-sm text-muted-foreground">
              {content.description}
            </DialogDescription>
          </motion.div>

          {/* Badge économie pour bundle */}
          {content.isBundle && (
            <motion.div
              className="mt-4 flex justify-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Badge
                variant="secondary"
                className="bg-green-500/10 text-green-500"
              >
                <Gift className="mr-1 h-3 w-3" />
                Économisez {formatCurrency(prices.bundleSavings, "XAF")}
              </Badge>
            </motion.div>
          )}

          {/* Avantages */}
          <motion.div
            className="mt-5 space-y-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {content.features.map((feature, index) => (
              <div
                key={index}
                className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/5 p-2.5 backdrop-blur-sm"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/60">
                  <feature.icon className="h-4 w-4 text-white" />
                </div>
                <div className="text-sm font-medium">{feature.text}</div>
              </div>
            ))}
          </motion.div>

          {/* Note supplémentaire */}
          {"note" in content && content.note && (
            <p className="mt-3 text-center text-xs text-muted-foreground">
              {content.note}
            </p>
          )}

          {/* Prix et boutons */}
          <motion.div
            className="mt-5"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25 }}
          >
            <div className="mb-4 text-center">
              <div className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-3xl font-bold text-transparent">
                {formatCurrency(content.price, "XAF")}
              </div>
              <div className="text-sm text-muted-foreground">
                {content.duration}
              </div>
            </div>

            <div className="space-y-2">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  className={cn(
                    "w-full rounded-xl bg-gradient-to-r from-primary via-primary/95 to-primary/85 font-semibold",
                    "shadow-lg shadow-primary/25 transition-shadow hover:shadow-xl hover:shadow-primary/35",
                    { "pointer-events-none opacity-70": isPending },
                  )}
                  onClick={() => handleCinetPayPayment(content.paymentType)}
                  disabled={isPending}
                  size="lg"
                >
                  {isPaymentPending ? (
                    <div className="flex items-center gap-2">
                      <LoaderCircle className="h-5 w-5 animate-spin" />
                      Traitement...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-5 w-5" />
                      Payer avec OM/MOMO
                    </div>
                  )}
                </Button>
              </motion.div>

              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full rounded-xl border-primary/30 font-semibold backdrop-blur-sm",
                    "transition-colors hover:border-primary/50 hover:bg-primary/5",
                    { "pointer-events-none opacity-70": isPending },
                  )}
                  onClick={() => handleStripePayment(content.paymentType)}
                  disabled={isPending}
                  size="lg"
                >
                  {isStripePending ? (
                    <div className="flex items-center gap-2">
                      <LoaderCircle className="h-5 w-5 animate-spin" />
                      Redirection...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Payer avec carte
                    </div>
                  )}
                </Button>
              </motion.div>
            </div>

            {/* Option d'achat séparé pour le bundle */}
            {content.isBundle && (
              <Button
                variant="link"
                onClick={onClose}
                className="mt-2 w-full text-xs text-muted-foreground"
                disabled={isPending}
              >
                Ou souscrire séparément
              </Button>
            )}

            <Button
              variant="ghost"
              onClick={onClose}
              className="mt-2 w-full"
              disabled={isPending}
            >
              Peut-être plus tard
            </Button>

            <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Shield className="h-3.5 w-3.5" />
              <span>Paiement sécurisé</span>
              <span>•</span>
              <span>Annulation facile</span>
            </div>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
