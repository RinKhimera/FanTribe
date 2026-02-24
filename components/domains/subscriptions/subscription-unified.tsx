"use client"

import { useMutation, useQuery } from "convex/react"
import {
  Check,
  CreditCard,
  Crown,
  LoaderCircle,
  MessageCircle,
  Shield,
  Smartphone,
  Star,
  X,
} from "lucide-react"
import { motion } from "motion/react"
import Image from "next/image"
import { isRedirectError } from "next/dist/client/components/redirect-error"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { startStripeCheckout } from "@/actions/stripe/checkout"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { api } from "@/convex/_generated/api"
import { Doc } from "@/convex/_generated/dataModel"
import { useCinetpayPayment } from "@/hooks/useCinetpayPayment"
import { useCurrentUser } from "@/hooks/useCurrentUser"
import { logger } from "@/lib/config/logger"
import { cn } from "@/lib/utils"
import { UserProps } from "@/types"

export type SubscriptionType = "subscribe" | "renew" | "unsubscribe"

type SubscriptionUnifiedProps = {
  isOpen?: boolean
  onClose?: () => void
  trigger?: React.ReactNode
  creator: Doc<"users"> | UserProps
  type?: SubscriptionType
  currentUser?: Doc<"users">
}

export const SubscriptionUnified = ({
  isOpen: controlledIsOpen,
  onClose,
  trigger,
  creator,
  type = "subscribe",
  currentUser: externalCurrentUser,
}: SubscriptionUnifiedProps) => {
  const { currentUser: hookCurrentUser } = useCurrentUser()
  const currentUser = externalCurrentUser || hookCurrentUser

  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = controlledIsOpen !== undefined
  const isOpen = isControlled ? controlledIsOpen : internalOpen

  const { processPayment, isPending: isPaymentPending } = useCinetpayPayment()
  const [isStripePending, startStripeTransition] = useTransition()
  const [isUnsubscribePending, startTransition] = useTransition()

  const canSubscribe = useQuery(
    api.subscriptions.canUserSubscribe,
    creator?._id ? { creatorId: creator._id } : "skip",
  )

  const subscription = useQuery(
    api.subscriptions.getFollowSubscription,
    currentUser && creator
      ? { creatorId: creator._id, subscriberId: currentUser._id }
      : "skip",
  )

  const cancelSubscription = useMutation(api.subscriptions.cancelSubscription)

  const handleOpenChange = (open: boolean) => {
    if (isControlled) {
      if (!open && onClose) {
        onClose()
      }
    } else {
      setInternalOpen(open)
    }
  }

  const handleSubscribe = () => {
    if (!currentUser || !creator) return

    if (type === "subscribe" && !canSubscribe?.canSubscribe) {
      const reasonMap: Record<string, string> = {
        self: "Vous ne pouvez pas vous abonner à vous-même",
        already_active: "Abonnement déjà actif",
        pending: "Abonnement en attente de validation",
        still_valid_until_expiry:
          "Abonnement encore valide jusqu'à son expiration",
        not_authenticated: "Veuillez vous connecter pour vous abonner",
        not_creator: "Cet utilisateur n'est pas un créateur",
      }
      const msg = canSubscribe?.reason
        ? reasonMap[canSubscribe.reason] ||
          "Impossible de s'abonner à cet utilisateur"
        : "Impossible de s'abonner à cet utilisateur"
      toast.error(msg)
      return
    }

    const actionText = type === "renew" ? "Renouvellement" : "Abonnement"
    processPayment({
      creatorId: creator._id,
      subscriberId: currentUser._id,
      creatorUsername: creator.username,
      amount: 1000,
      description: `${actionText} mensuel - ${creator.username}`,
      customFields: {
        type: "subscription",
        action: type === "renew" ? "renew" : "subscribe",
      },
    })
  }

  const handleSubscribeStripe = async () => {
    if (!currentUser || !creator) return
    startStripeTransition(async () => {
      try {
        await startStripeCheckout({
          creatorId: creator._id as string,
          subscriberId: currentUser._id as string,
          creatorUsername: creator.username as string,
          action: type === "renew" ? "renew" : "subscribe",
        })
      } catch (error) {
        // Relancer les erreurs de redirection Next.js (comportement normal)
        if (isRedirectError(error)) {
          throw error
        }

        const errorMessage =
          error instanceof Error ? error.message : "Erreur inconnue"

        logger.error("Stripe checkout failed", error, {
          creatorId: creator._id,
          subscriberId: currentUser._id,
          action: type,
        })

        toast.error("Impossible de démarrer le paiement Stripe", {
          description: errorMessage,
        })
      }
    })
  }

  const handleUnsubscribe = () => {
    if (!subscription?._id || !currentUser || !creator) return
    startTransition(async () => {
      try {
        await cancelSubscription({ subscriptionId: subscription._id })

        logger.success("Subscription cancelled", {
          subscriptionId: subscription._id,
          creatorId: creator._id,
        })

        toast.success("Abonnement annulé avec succès")
        handleOpenChange(false)
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Veuillez vérifier votre connexion internet et réessayer"

        logger.error("Subscription cancellation failed", error, {
          subscriptionId: subscription._id,
          creatorId: creator._id,
          subscriberId: currentUser._id,
        })

        toast.error("Impossible d'annuler l'abonnement", {
          description: errorMessage,
        })
      }
    })
  }

  const getDialogContent = () => {
    switch (type) {
      case "subscribe":
        return {
          title: `Rejoignez ${creator?.name}`,
          description: "Débloquez un contenu exclusif et bien plus encore",
          buttonText: "Commencer l'abonnement",
          showFeatures: true,
        }
      case "renew":
        return {
          title:
            "Renouvelez votre abonnement pour profiter de tous les avantages :",
          description: null,
          buttonText: "RENOUVELER",
          showFeatures: true,
        }
      case "unsubscribe":
        return {
          title: `Se désabonner de ${creator?.name} ?`,
          description: `Cela mettra fin à votre abonnement à ${creator?.name}. Vous devrez vous abonner à nouveau pour accéder à son contenu.`,
          buttonText: "Se désabonner",
          showFeatures: false,
        }
    }
  }

  const dialogContent = getDialogContent()
  const isPending = isPaymentPending || isUnsubscribePending || isStripePending

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-sm overflow-hidden border-primary/10 bg-background/95 p-0 shadow-2xl backdrop-blur-xl">
        {/* Header avec image de fond */}
        <div className="relative">
          <div className="h-36 overflow-hidden">
            <Image
              className="h-full w-full object-cover"
              src={
                (creator?.imageBanner as string) ||
                "https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=800&dpr=2&q=80"
              }
              alt={creator?.name as string}
              width={400}
              height={144}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-primary/10" />
          </div>

          {/* Bouton fermer (seulement en mode controlled) */}
          {isControlled && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleOpenChange(false)}
              className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/20 text-white hover:bg-black/40"
            >
              <X className="h-4 w-4" />
            </Button>
          )}

          {/* Avatar centré avec glow */}
          <motion.div
            className="absolute -bottom-14 left-1/2 -translate-x-1/2"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute inset-0 scale-110 rounded-full bg-primary/20 blur-xl" />
              <Avatar className="ring-primary/40 ring-offset-background relative h-28 w-28 ring-4 ring-offset-2 shadow-xl">
                <AvatarImage src={creator?.image} className="object-cover" />
                <AvatarFallback className="bg-muted text-2xl">
                  {creator?.name?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>
              {type !== "unsubscribe" && (
                <motion.div
                  className="absolute -right-1 -bottom-1 rounded-full bg-primary p-1.5 shadow-lg"
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Crown className="h-4 w-4 text-primary-foreground" />
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Contenu principal */}
        <div className="px-6 pt-[4.5rem] pb-6">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <DialogTitle className="text-xl font-bold">
              {dialogContent.title}
            </DialogTitle>
            {dialogContent.description && (
              <DialogDescription className="text-muted-foreground mt-2">
                {dialogContent.description}
              </DialogDescription>
            )}
          </motion.div>

          {/* Avantages avec glass-card effect */}
          {dialogContent.showFeatures && (
            <motion.div
              className="mt-6 space-y-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/60">
                  <Star className="h-4 w-4 text-white" />
                </div>
                <div className="text-sm font-medium">
                  {type === "subscribe"
                    ? "Contenu exclusif et premium"
                    : "Accès complet au contenu"}
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/60">
                  <MessageCircle className="h-4 w-4 text-white" />
                </div>
                <div className="text-sm font-medium">
                  {type === "subscribe"
                    ? "Accès à la communauté privée"
                    : "Messages directs"}
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/60">
                  <Check className="h-4 w-4 text-white" />
                </div>
                <div className="text-sm font-medium">Sans engagement</div>
              </div>
            </motion.div>
          )}

          {/* Prix avec animation */}
          <motion.div
            className="mt-6"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25 }}
          >
            {type !== "unsubscribe" && (
              <div className="mb-5 text-center">
                <div className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-4xl font-bold text-transparent">
                  1000 XAF
                </div>
                <div className="text-muted-foreground text-sm">par mois</div>
              </div>
            )}

            {type === "unsubscribe" ? (
              <Button
                className={cn(
                  "w-full text-lg font-semibold shadow-lg transition-all",
                  "bg-destructive text-destructive-foreground hover:bg-destructive/90",
                  { "pointer-events-none opacity-70": isPending },
                )}
                onClick={handleUnsubscribe}
                disabled={isPending || !subscription}
                size="lg"
              >
                {isPending ? (
                  <div className="flex items-center gap-2">
                    <LoaderCircle className="h-5 w-5 animate-spin" />
                    Annulation...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">Se désabonner</div>
                )}
              </Button>
            ) : (
              <div className="space-y-3">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    className={cn(
                      "w-full rounded-xl bg-gradient-to-r from-primary via-primary/95 to-primary/85 text-lg font-semibold",
                      "shadow-lg shadow-primary/25 transition-shadow hover:shadow-xl hover:shadow-primary/35",
                      { "pointer-events-none opacity-70": isPending },
                    )}
                    onClick={handleSubscribe}
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
                      "w-full rounded-xl border-primary/30 text-lg font-semibold backdrop-blur-sm",
                      "transition-colors hover:border-primary/50 hover:bg-primary/5",
                      { "pointer-events-none opacity-70": isPending },
                    )}
                    onClick={handleSubscribeStripe}
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
            )}

            {/* Bouton "Peut-être plus tard" uniquement en mode controlled */}
            {isControlled && type !== "unsubscribe" && (
              <Button
                variant="ghost"
                onClick={() => handleOpenChange(false)}
                className="mt-3 w-full"
                disabled={isPending}
              >
                Peut-être plus tard
              </Button>
            )}

            {type !== "unsubscribe" && (
              <div className="text-muted-foreground mt-4 flex items-center justify-center gap-2 text-xs">
                <Shield className="h-3.5 w-3.5" />
                <span>Paiement sécurisé</span>
                <span>•</span>
                <span>Annulation facile</span>
              </div>
            )}
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
