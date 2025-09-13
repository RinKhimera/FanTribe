"use client"

import { useQuery } from "convex/react"
import { Check, Crown, LoaderCircle, MessageCircle, Star } from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"
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
import { usePayment } from "@/hooks/useCinetpayPayment"
import { useCurrentUser } from "@/hooks/useCurrentUser"
import { cn } from "@/lib/utils"
import { UserProps } from "@/types"

type SubscribeDialogProps = {
  userProfile: UserProps
}

export const SubscribeDialog = ({ userProfile }: SubscribeDialogProps) => {
  const { currentUser } = useCurrentUser()
  const { processPayment, isPending } = usePayment()

  const canSubscribe = useQuery(
    api.subscriptions.canUserSubscribe,
    userProfile?._id ? { creatorId: userProfile._id } : "skip",
  )

  const handleSubscribe = () => {
    if (!currentUser || !userProfile) return

    if (!canSubscribe?.canSubscribe) {
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

    processPayment({
      creatorId: userProfile._id,
      subscriberId: currentUser._id,
      creatorUsername: userProfile.username,
      amount: 100,
      description: `Abonnement mensuel - ${userProfile.username}`,
      customFields: {
        type: "subscription",
        action: "subscribe",
      },
    })
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="from-primary to-primary/80 mt-3 w-full justify-between rounded-2xl bg-linear-to-r text-lg font-semibold shadow-lg transition-all hover:shadow-xl">
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            S&apos;ABONNER
          </div>
          <div className="font-bold">1000 XAF</div>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm overflow-hidden border-0 p-0 shadow-2xl">
        {/* Header avec image de fond */}
        <div className="relative">
          <div className="h-32 overflow-hidden">
            <Image
              className="h-full w-full object-cover"
              src={
                (userProfile?.imageBanner as string) ||
                "https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=800&dpr=2&q=80"
              }
              alt={userProfile?.name as string}
              width={400}
              height={128}
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
          </div>

          {/* Avatar centré */}
          <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
            <div className="relative">
              <Avatar className="border-background h-24 w-24 border-4 shadow-xl">
                <AvatarImage
                  src={userProfile?.image}
                  className="object-cover"
                />
                <AvatarFallback className="bg-muted">
                  <div className="bg-muted-foreground/20 h-full w-full animate-pulse rounded-full" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-primary absolute -right-1 -bottom-1 rounded-full p-1">
                <Crown className="text-primary-foreground h-4 w-4" />
              </div>
            </div>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="px-6 pt-16 pb-6">
          <div className="text-center">
            <DialogTitle className="text-xl font-bold">
              Rejoignez {userProfile?.name}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground mt-2">
              Débloquez un contenu exclusif et bien plus encore
            </DialogDescription>
          </div>

          {/* Avantages avec icônes modernes */}
          <div className="mt-6 space-y-4">
            <div className="bg-muted/50 flex items-center gap-3 rounded-lg p-3">
              <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-full">
                <Star className="text-primary h-4 w-4" />
              </div>
              <div className="text-sm font-medium">
                Contenu exclusif et premium
              </div>
            </div>

            <div className="bg-muted/50 flex items-center gap-3 rounded-lg p-3">
              <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-full">
                <MessageCircle className="text-primary h-4 w-4" />
              </div>
              <div className="text-sm font-medium">
                Accès à la communauté privée
              </div>
            </div>

            <div className="bg-muted/50 flex items-center gap-3 rounded-lg p-3">
              <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-full">
                <Check className="text-primary h-4 w-4" />
              </div>
              <div className="text-sm font-medium">
                Résiliation à tout moment
              </div>
            </div>
          </div>

          {/* Prix et bouton */}
          <div className="mt-6">
            <div className="mb-4 text-center">
              <div className="text-3xl font-bold">1000 XAF</div>
              <div className="text-muted-foreground text-sm">par mois</div>
            </div>

            <Button
              className={cn(
                "from-primary to-primary/80 w-full rounded-xl bg-linear-to-r text-lg font-semibold shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl",
                {
                  "pointer-events-none opacity-70": isPending,
                },
              )}
              onClick={handleSubscribe}
              disabled={isPending}
              size="lg"
            >
              {isPending ? (
                <div className="flex items-center gap-2">
                  <LoaderCircle className="h-5 w-5 animate-spin" />
                  Traitement...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Crown className="h-5 w-5" />
                  Commencer l&apos;abonnement
                </div>
              )}
            </Button>

            <p className="text-muted-foreground mt-3 text-center text-xs">
              Paiement sécurisé • Annulation facile
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
