"use client"

import { useMutation, useQuery } from "convex/react"
import { LoaderCircle } from "lucide-react"
import Image from "next/image"
import { useTransition } from "react"
import { toast } from "sonner"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { api } from "@/convex/_generated/api"
import { useCurrentUser } from "@/hooks/useCurrentUser"
import { UserProps } from "@/types"

type SubscribeDialogProps = {
  userProfile: UserProps
}

export const UnsubscribeDialog = ({ userProfile }: SubscribeDialogProps) => {
  const [isPending, startTransition] = useTransition()
  const { currentUser } = useCurrentUser()

  const subscription = useQuery(
    api.subscriptions.getFollowSubscription,
    currentUser && userProfile
      ? { creatorId: userProfile._id, subscriberId: currentUser._id }
      : "skip",
  )

  const cancelSubscription = useMutation(api.subscriptions.cancelSubscription)

  const handleUnfollow = () => {
    if (!subscription?._id) return
    startTransition(async () => {
      try {
        await cancelSubscription({ subscriptionId: subscription._id })
        toast.success("Abonnement annulé")
      } catch (error) {
        console.error(error)
        toast.error("Une erreur s'est produite !", {
          description:
            "Veuillez vérifier votre connexion internet et réessayer",
        })
      }
    })
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant={"outline"}
          className="border-muted mt-3 w-full justify-between rounded-3xl border-2 text-lg"
        >
          <>
            <div>ABONNÉ</div>
            <div className="font-bold">1000 XAF</div>
          </>
        </Button>
      </DialogTrigger>
      <DialogContent className="h-5/6 max-w-md overflow-auto p-0">
        <div className="relative flex flex-col justify-evenly px-4">
          <div className="relative h-fit">
            <div>
              <AspectRatio ratio={3 / 1} className="bg-muted">
                <Image
                  className="object-cover"
                  src={
                    (userProfile?.imageBanner as string) ||
                    "https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=800&dpr=2&q=80"
                  }
                  alt={userProfile?.name as string}
                  fill
                />
              </AspectRatio>
            </div>
            <div className="absolute -bottom-[48px] left-5 max-sm:-bottom-[38px]">
              <Avatar className="border-accent relative size-28 border-4 object-none object-center max-sm:size-24">
                <AvatarImage
                  src={userProfile?.image}
                  className="object-cover"
                />
                <AvatarFallback className="size-11">
                  <div className="animate-pulse rounded-full bg-gray-500"></div>
                </AvatarFallback>
              </Avatar>
            </div>
          </div>

          <DialogTitle className="mt-5 text-center text-xl">
            Se désabonner de {userProfile?.name} ?
          </DialogTitle>

          <DialogDescription className="text-base">
            <div>
              Cela mettra fin à votre abonnement à {userProfile?.name}. Vous
              devrez vous abonner à nouveau pour accéder à son contenu.
            </div>
          </DialogDescription>

          <DialogFooter>
            <Button
              className="w-full text-lg"
              onClick={handleUnfollow}
              disabled={isPending || !subscription}
            >
              {isPending ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                "Se désabonner"
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
