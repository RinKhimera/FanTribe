"use client"

import { Clock, Lock, RefreshCw } from "lucide-react"
import { motion } from "motion/react"
import Link from "next/link"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { cardHoverVariants } from "@/lib/animations"
import { formatCustomTimeAgo, pluralize } from "@/lib/formatters"
import { cn } from "@/lib/utils"

type SubscriptionEntry = {
  _id: string
  _creationTime: number
  status: "active" | "expired" | "canceled" | "pending"
  startDate: number
  endDate: number
  renewalCount: number
  creator: {
    _id: string
    name: string
    username?: string
    image: string
    imageBanner?: string
    isOnline: boolean
  }
  daysUntilExpiry: number
  subscribedDurationMonths: number
  creatorLastPostDate: number | null
  creatorExclusivePostCount: number
}

export const SubscriptionCard = ({
  subscription,
}: {
  subscription: SubscriptionEntry
}) => {
  const { creator, status, renewalCount, daysUntilExpiry, subscribedDurationMonths, creatorLastPostDate, creatorExclusivePostCount } = subscription
  const isActive = status === "active"
  const isExpiringSoon = isActive && daysUntilExpiry <= 7

  const profileHref = `/${creator.username || creator._id}`

  return (
    <motion.div
      variants={cardHoverVariants}
      initial="rest"
      whileHover="hover"
      whileTap="tap"
    >
      <Card className="overflow-hidden transition-[border-color,box-shadow]">
        <CardContent className="p-4">
          <div className="flex gap-3">
            {/* Avatar with online indicator */}
            <Link href={profileHref} className="relative shrink-0">
              <Avatar className="size-14">
                <AvatarImage
                  src={creator.image}
                  alt={creator.name}
                  sizes="56px"
                />
                <AvatarFallback>
                  {creator.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {creator.isOnline && (
                <span
                  className="border-background absolute right-0 bottom-0 size-3.5 rounded-full border-2 bg-emerald-500"
                  aria-label="En ligne"
                />
              )}
            </Link>

            {/* Info */}
            <div className="min-w-0 flex-1">
              {/* Name + badge row */}
              <div className="flex items-center gap-2">
                <Link
                  href={profileHref}
                  className="truncate font-semibold hover:underline"
                >
                  {creator.name}
                </Link>
                <Badge
                  variant={isActive ? "default" : "outline"}
                  className={cn(
                    "shrink-0",
                    isActive && "bg-emerald-500/15 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/15 dark:text-emerald-400",
                    !isActive && "text-muted-foreground",
                  )}
                >
                  {isActive ? "Actif" : "Expiré"}
                </Badge>
              </div>

              {/* Username */}
              {creator.username && (
                <p className="text-muted-foreground truncate text-sm">
                  @{creator.username}
                </p>
              )}

              {/* Meta row */}
              <div className="text-muted-foreground mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs">
                <span className="flex items-center gap-1">
                  <Clock className="size-3" aria-hidden="true" />
                  Abonné depuis {subscribedDurationMonths} mois
                </span>
                {renewalCount > 0 && (
                  <span className="flex items-center gap-1">
                    <RefreshCw className="size-3" aria-hidden="true" />
                    {renewalCount} {pluralize(renewalCount, "renouvellement")}
                  </span>
                )}
                {creatorExclusivePostCount > 0 && (
                  <span className="flex items-center gap-1">
                    <Lock className="size-3" aria-hidden="true" />
                    {creatorExclusivePostCount} {pluralize(creatorExclusivePostCount, "post exclusif", "posts exclusifs")}
                  </span>
                )}
              </div>

              {/* Expiry warning */}
              {isExpiringSoon && (
                <p className="mt-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                  Expire dans {daysUntilExpiry} {pluralize(daysUntilExpiry, "jour")}
                </p>
              )}

              {/* Last activity */}
              {creatorLastPostDate && (
                <p className="text-muted-foreground mt-1 text-xs">
                  Dernier post : {formatCustomTimeAgo(creatorLastPostDate)}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
