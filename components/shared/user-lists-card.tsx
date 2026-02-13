import { useMutation } from "convex/react"
import { Loader2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { logger } from "@/lib/config/logger"

export type UserCardMode = "subscription-list" | "blocked-list"
export type SubscriptionStatus = "subscribed" | "unsubscribed"

interface UserCardProps {
  user: {
    id: Id<"users">
    name: string
    username: string
    avatarUrl: string
    bannerUrl: string
  }
  mode: UserCardMode
  subscriptionStatus?: SubscriptionStatus
  onActionSuccess?: () => void
}

export const UserListsCard = ({
  user,
  mode,
  subscriptionStatus,
  onActionSuccess,
}: UserCardProps) => {
  const [isBlocking, setIsBlocking] = useState(false)
  const blockUser = useMutation(api.blocks.blockUser)
  const unblockUser = useMutation(api.blocks.unblockUser)

  const profileUrl = `/${user.username}`

  const handleBlockUnblock = async () => {
    setIsBlocking(true)
    try {
      if (mode === "blocked-list") {
        // Débloquer l'utilisateur
        await unblockUser({ targetUserId: user.id })
        toast.success("Utilisateur débloqué", {
          description: `Vous avez débloqué ${user.name}`,
        })
        onActionSuccess?.()
      } else {
        // Bloquer l'utilisateur
        await blockUser({ targetUserId: user.id })
        toast.error("Utilisateur bloqué", {
          description: `Vous avez bloqué ${user.name}`,
        })
      }
    } catch (error) {
      logger.error("Failed to toggle block status", error, {
        userId: user.id,
        mode,
      })
      toast.error("Une erreur s'est produite !", {
        description: "Veuillez vérifier votre connexion internet et réessayer",
      })
    }
    setIsBlocking(false)
  }

  return (
    <Card className="overflow-hidden">
      {/* Bannière cliquable */}
      <Link href={profileUrl} className="relative block h-20 w-full">
        {user.bannerUrl ? (
          <Image
            src={user.bannerUrl}
            alt={`Bannière de ${user.name}`}
            fill
            className="object-cover"
          />
        ) : (
          <div className="h-full w-full bg-linear-to-r from-purple-500 to-blue-500" />
        )}
      </Link>

      <CardContent className="p-2">
        <div className="flex items-start gap-1">
          {/* Avatar cliquable */}
          <Link
            href={profileUrl}
            className="border-background -mt-14 block rounded-full border-4"
          >
            <Avatar className="h-20 w-20 overflow-hidden">
              <AvatarImage
                src={user.avatarUrl}
                alt={user.name}
                sizes="80px"
              />
              <AvatarFallback className="text-xl">
                {user.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Link>

          <div className="flex-1">
            <div className="mb-2">
              {/* Nom cliquable avec soulignement au survol */}
              <Link href={profileUrl} className="block">
                <h3 className="truncate text-lg font-semibold hover:underline">
                  {user.name}
                </h3>
              </Link>
              {/* Nom d'utilisateur cliquable avec soulignement au survol */}
              <Link href={profileUrl} className="block">
                <p className="text-muted-foreground truncate text-sm hover:underline">
                  @{user.username}
                </p>
              </Link>
            </div>

            <div className="flex gap-2">
              {/* Bouton d'abonnement (uniquement en mode subscription-list) */}
              {mode === "subscription-list" && onActionSuccess && (
                <Button
                  variant={subscriptionStatus === "subscribed" ? "outline" : "default"}
                  size="sm"
                  onClick={onActionSuccess}
                >
                  {subscriptionStatus === "subscribed" ? "Abonné" : "S'abonner"}
                </Button>
              )}

              {/* Bouton de blocage/déblocage */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleBlockUnblock}
                disabled={isBlocking}
                className={
                  mode === "blocked-list"
                    ? ""
                    : "text-destructive hover:bg-destructive/10"
                }
              >
                {isBlocking ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : mode === "blocked-list" ? (
                  "Débloquer"
                ) : (
                  "Bloquer"
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
