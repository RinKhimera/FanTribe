"use client"

import { Check, LoaderCircle, X } from "lucide-react"
import Image from "next/image"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Doc } from "@/convex/_generated/dataModel"
import { useCinetpayPayment } from "@/hooks/useCinetpayPayment"
import { cn } from "@/lib/utils"

interface SubscriptionModalProps {
  isOpen: boolean
  onClose: () => void
  creator: Doc<"users">
  currentUser: Doc<"users">
}

export const SubscriptionModal = ({
  isOpen,
  onClose,
  creator,
  currentUser,
}: SubscriptionModalProps) => {
  const { processPayment, isPending } = useCinetpayPayment()

  const handleSubscribe = () => {
    if (!currentUser || !creator) return

    processPayment({
      creatorId: creator._id,
      subscriberId: currentUser._id,
      creatorUsername: creator.username,
      amount: 1000,
      description: `Abonnement mensuel - ${creator.username}`,
      customFields: {
        type: "subscription",
        action: "subscribe",
      },
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md overflow-hidden p-0">
        <div className="relative">
          {/* Header avec image de bannière */}
          <div className="relative h-32">
            <AspectRatio ratio={3 / 1} className="bg-muted">
              <Image
                className="object-cover"
                src={
                  (creator?.imageBanner as string) ||
                  "https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=800&dpr=2&q=80"
                }
                alt={creator?.name || "Banner"}
                fill
              />
            </AspectRatio>

            {/* Bouton fermer */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/20 text-white hover:bg-black/40"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Avatar du créateur - Position ajustée */}
          <div className="absolute top-[105px] left-6 max-sm:top-20">
            <Avatar className="border-background h-20 w-20 border-4">
              <AvatarImage
                src={creator?.image}
                className="object-cover"
                alt={creator?.name || "Avatar"}
              />
              <AvatarFallback>{creator?.name?.charAt(0) || "U"}</AvatarFallback>
            </Avatar>
          </div>

          {/* Contenu principal - Padding ajusté */}
          <div className="px-6 pt-16 pb-6">
            <DialogHeader className="space-y-3">
              <div className="text-left">
                <DialogTitle className="text-xl font-bold">
                  {creator?.name}
                </DialogTitle>
                <p className="text-muted-foreground">@{creator?.username}</p>
              </div>

              <DialogDescription className="text-left">
                <h3 className="text-foreground mb-4 text-lg font-semibold">
                  Débloquez du contenu exclusif
                </h3>
                <p className="mb-4 text-sm">
                  Abonnez-vous pour accéder à tous les contenus de ce créateur
                  et profiter des avantages suivants :
                </p>
              </DialogDescription>
            </DialogHeader>

            {/* Liste des avantages */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                <div className="text-sm">
                  <span className="font-medium">Contenu exclusif</span>
                  <p className="text-muted-foreground">
                    Accès à tous les posts et médias privés
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                <div className="text-sm">
                  <span className="font-medium">Messages directs</span>
                  <p className="text-muted-foreground">
                    Communiquez directement avec le créateur
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                <div className="text-sm">
                  <span className="font-medium">Flexibilité</span>
                  <p className="text-muted-foreground">
                    Annulez votre abonnement à tout moment
                  </p>
                </div>
              </div>
            </div>

            {/* Prix et bouton */}
            <DialogFooter className="mt-6">
              <div className="w-full space-y-3">
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="text-muted-foreground text-sm">Prix mensuel</p>
                  <p className="text-primary text-2xl font-bold">1000 XAF</p>
                </div>

                <Button
                  onClick={handleSubscribe}
                  disabled={isPending}
                  className={cn("w-full", {
                    "justify-center": isPending,
                  })}
                  size="lg"
                >
                  {isPending ? (
                    <>
                      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                      Traitement...
                    </>
                  ) : (
                    "S'abonner maintenant"
                  )}
                </Button>

                <Button
                  variant="ghost"
                  onClick={onClose}
                  className="w-full"
                  disabled={isPending}
                >
                  Peut-être plus tard
                </Button>
              </div>
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
