"use client"

import { Coins, UserPlus } from "lucide-react"
import { motion } from "motion/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { containerVariants, itemVariants } from "@/lib/animations"
import { formatCustomTimeAgo } from "@/lib/formatters"

interface Activity {
  type: "new_subscriber" | "tip_received"
  timestamp: number
  actorName: string
  actorImage: string
  amount?: number
}

interface RecentActivityFeedProps {
  activities: Activity[]
}

const formatAmount = (amount: number) =>
  new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)

export const RecentActivityFeed = ({
  activities,
}: RecentActivityFeedProps) => {
  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Activité récente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground py-8 text-center text-sm">
            Aucune activité récente
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">
          Activité récente
        </CardTitle>
      </CardHeader>
      <CardContent>
        <motion.div
          variants={containerVariants}
          initial="initial"
          animate="animate"
          className="space-y-1"
        >
          {activities.map((activity, index) => (
            <motion.div
              key={`${activity.type}-${activity.timestamp}-${index}`}
              variants={itemVariants}
              className="flex items-center gap-3 rounded-lg p-2.5 transition-colors hover:bg-white/5"
            >
              {/* Icon */}
              <div
                className={
                  activity.type === "new_subscriber"
                    ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/10"
                    : "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500/10"
                }
              >
                {activity.type === "new_subscriber" ? (
                  <UserPlus className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Coins className="h-4 w-4 text-amber-500" />
                )}
              </div>

              {/* Avatar */}
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={activity.actorImage}
                  className="object-cover"
                />
                <AvatarFallback className="bg-muted text-xs">
                  {activity.actorName.charAt(0)}
                </AvatarFallback>
              </Avatar>

              {/* Text */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">
                  <span className="font-medium">{activity.actorName}</span>
                  <span className="text-muted-foreground">
                    {activity.type === "new_subscriber"
                      ? " s'est abonné(e)"
                      : ` a envoyé ${formatAmount(activity.amount ?? 0)} XAF`}
                  </span>
                </p>
                <p className="text-muted-foreground text-xs">
                  {formatCustomTimeAgo(activity.timestamp)}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </CardContent>
    </Card>
  )
}
