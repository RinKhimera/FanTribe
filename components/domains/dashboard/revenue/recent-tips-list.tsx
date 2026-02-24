"use client"

import { Coins } from "lucide-react"
import { motion } from "motion/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { containerVariants, itemVariants } from "@/lib/animations"
import { formatCustomTimeAgo } from "@/lib/formatters"

interface Tip {
  _id: string
  _creationTime: number
  amount: number
  currency: string
  message?: string
  context?: string
  sender: {
    _id: string
    name: string
    username?: string
    image: string
  } | null
}

interface RecentTipsListProps {
  tips: Tip[]
}

const formatAmount = (amount: number) =>
  new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)

export const RecentTipsList = ({ tips }: RecentTipsListProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Coins className="h-5 w-5 text-amber-500" aria-hidden="true" />
          Pourboires récents
        </CardTitle>
      </CardHeader>
      <CardContent>
        <motion.div
          variants={containerVariants}
          initial="initial"
          animate="animate"
          className="space-y-3"
        >
          {tips.map((tip) => (
            <motion.div
              key={tip._id}
              variants={itemVariants}
              className="flex items-center gap-3 rounded-lg border border-white/5 p-3"
            >
              <Avatar className="h-9 w-9">
                <AvatarImage
                  src={tip.sender?.image}
                  className="object-cover"
                />
                <AvatarFallback className="bg-muted text-xs">
                  {tip.sender?.name?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {tip.sender?.name || "Utilisateur"}
                  </span>
                  <span className="text-sm font-bold text-amber-500">
                    {formatAmount(tip.amount)} XAF
                  </span>
                </div>
                {tip.message && (
                  <p className="text-muted-foreground mt-0.5 line-clamp-1 text-xs">
                    {tip.message}
                  </p>
                )}
                <p className="text-muted-foreground mt-0.5 text-xs">
                  {formatCustomTimeAgo(tip._creationTime)}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </CardContent>
    </Card>
  )
}
