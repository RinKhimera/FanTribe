"use client"

import { useMutation, useQuery } from "convex/react"
import {
  Check,
  Crown,
  LoaderCircle,
  MessageCircle,
  Star,
  X,
} from "lucide-react"
import Image from "next/image"
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
      <DialogContent className="max-w-sm overflow-hidden border-0 p-0 shadow-2xl">
        {/* Header avec image de fond */}
        <div className="relative">
          <div className="h-32 overflow-hidden">
            <Image
              className="h-full w-full object-cover"
              src={
                (creator?.imageBanner as string) ||
                "https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=800&dpr=2&q=80"
              }
              alt={creator?.name as string}
              width={400}
              height={128}
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
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

          {/* Avatar centré */}
          <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
            <div className="relative">
              <Avatar className="border-background h-24 w-24 border-4 shadow-xl">
                <AvatarImage src={creator?.image} className="object-cover" />
                <AvatarFallback className="bg-muted">
                  <div className="bg-muted-foreground/20 h-full w-full animate-pulse rounded-full" />
                </AvatarFallback>
              </Avatar>
              {type !== "unsubscribe" && (
                <div className="bg-primary absolute -right-1 -bottom-1 rounded-full p-1">
                  <Crown className="text-primary-foreground h-4 w-4" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="px-6 pt-16 pb-6">
          <div className="text-center">
            <DialogTitle className="text-xl font-bold">
              {dialogContent.title}
            </DialogTitle>
            {dialogContent.description && (
              <DialogDescription className="text-muted-foreground mt-2">
                {dialogContent.description}
              </DialogDescription>
            )}
          </div>

          {/* Avantages avec icônes modernes (pour subscribe et renew) */}
          {dialogContent.showFeatures && (
            <div className="mt-6 space-y-4">
              <div className="bg-muted/50 flex items-center gap-3 rounded-lg p-3">
                <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-full">
                  <Star className="text-primary h-4 w-4" />
                </div>
                <div className="text-sm font-medium">
                  {type === "subscribe"
                    ? "Contenu exclusif et premium"
                    : "Accès complet au contenu de cet utilisateur"}
                </div>
              </div>

              <div className="bg-muted/50 flex items-center gap-3 rounded-lg p-3">
                <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-full">
                  <MessageCircle className="text-primary h-4 w-4" />
                </div>
                <div className="text-sm font-medium">
                  {type === "subscribe"
                    ? "Accès à la communauté privée"
                    : "Message direct avec cet utilisateur"}
                </div>
              </div>

              <div className="bg-muted/50 flex items-center gap-3 rounded-lg p-3">
                <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-full">
                  <Check className="text-primary h-4 w-4" />
                </div>
                <div className="text-sm font-medium">
                  {type === "subscribe"
                    ? "Sans engagement"
                    : "Annuler votre abonnement à tout moment"}
                </div>
              </div>
            </div>
          )}

          {/* Prix et bouton */}
          <div className="mt-6">
            {type !== "unsubscribe" && (
              <div className="mb-4 text-center">
                <div className="text-3xl font-bold">1000 XAF</div>
                <div className="text-muted-foreground text-sm">par mois</div>
              </div>
            )}

            {type === "unsubscribe" ? (
              <Button
                className={cn(
                  "w-full text-lg font-semibold shadow-lg transition-all",
                  "hover:bg-destructive/90 bg-destructive text-destructive-foreground",
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
              <div className="grid grid-cols-1 gap-3">
                <Button
                  className={cn(
                    "from-primary to-primary/80 w-full rounded-xl bg-linear-to-r text-lg font-semibold shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl",
                    { "pointer-events-none opacity-70": isPending },
                  )}
                  onClick={handleSubscribe}
                  disabled={isPending}
                  size="lg"
                >
                  {isPaymentPending ? (
                    <div className="flex items-center gap-2">
                      <LoaderCircle className="h-5 w-5 animate-spin" />
                      Traitement CinetPay...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Crown className="h-5 w-5" />
                      Payer avec OM/MOMO
                    </div>
                  )}
                </Button>

                <Button
                  variant="outline"
                  className={cn("w-full text-lg font-semibold", {
                    "pointer-events-none opacity-70": isPending,
                  })}
                  onClick={handleSubscribeStripe}
                  disabled={isPending}
                  size="lg"
                >
                  {isStripePending ? (
                    <div className="flex items-center gap-2">
                      <LoaderCircle className="h-5 w-5 animate-spin" />
                      Redirection Stripe...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      Payer avec Stripe (carte)
                    </div>
                  )}
                </Button>
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
              <p className="text-muted-foreground mt-3 text-center text-xs">
                Paiement sécurisé • Annulation facile
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
