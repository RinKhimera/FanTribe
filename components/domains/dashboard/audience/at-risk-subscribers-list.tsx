"use client"

import { AlertTriangle, CheckCircle } from "lucide-react"
import { motion } from "motion/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { containerVariants, itemVariants } from "@/lib/animations"
import { cn } from "@/lib/utils"

type AtRiskSubscriber = {
  _id: string
  name: string
  username?: string
  image: string
  daysLeft: number
  subscriptionId: string
}

interface AtRiskSubscribersListProps {
  subscribers: AtRiskSubscriber[]
}

export const AtRiskSubscribersList = ({
  subscribers,
}: AtRiskSubscribersListProps) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle aria-hidden="true" className="h-5 w-5 text-amber-500" />
          <CardTitle className="text-base font-semibold">
            Abonnés à risque
          </CardTitle>
          {subscribers.length > 0 && (
            <Badge
              variant="outline"
              className="border-amber-500/30 bg-amber-500/10 text-amber-500"
            >
              {subscribers.length}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {subscribers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <CheckCircle aria-hidden="true" className="mb-2 h-8 w-8 text-emerald-500/40" />
            <p className="text-sm text-emerald-600">
              Aucun abonné à risque
            </p>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="initial"
            animate="animate"
            className="space-y-1"
          >
            {subscribers.map((sub) => {
              const isUrgent = sub.daysLeft <= 3

              return (
                <motion.div
                  key={sub._id}
                  variants={itemVariants}
                  className="flex items-center gap-3 rounded-lg p-2.5 transition-colors hover:bg-white/5"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={sub.image}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-muted text-xs">
                      {sub.name?.charAt(0) ?? "?"}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium">
                        {sub.name}
                      </span>
                      {sub.username && (
                        <span className="text-muted-foreground truncate text-xs">
                          @{sub.username}
                        </span>
                      )}
                    </div>
                  </div>

                  <span
                    className={cn(
                      "shrink-0 text-xs font-medium",
                      isUrgent ? "text-red-500" : "text-amber-500",
                    )}
                  >
                    Expire dans {sub.daysLeft} jour
                    {sub.daysLeft > 1 ? "s" : ""}
                  </span>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </CardContent>
    </Card>
  )
}
