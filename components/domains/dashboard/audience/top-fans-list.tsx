"use client"

import { Crown, Trophy } from "lucide-react"
import { motion } from "motion/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { containerVariants, itemVariants } from "@/lib/animations"
import { formatCurrency } from "@/lib/formatters"
import { cn } from "@/lib/utils"

type TopFan = {
  _id: string
  name: string
  username?: string
  image: string
  renewalCount: number
  totalSpent: number
}

interface TopFansListProps {
  fans: TopFan[]
}

const rankColors: Record<number, string> = {
  1: "bg-amber-500/20 text-amber-500 border-amber-500/30",
  2: "bg-zinc-300/20 text-zinc-400 border-zinc-400/30",
  3: "bg-orange-600/20 text-orange-500 border-orange-600/30",
}

export const TopFansList = ({ fans }: TopFansListProps) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Crown aria-hidden="true" className="text-amber-500 h-5 w-5" />
          <CardTitle className="text-base font-semibold">
            Top fans fidèles
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {fans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Trophy aria-hidden="true" className="text-muted-foreground/40 mb-2 h-8 w-8" />
            <p className="text-muted-foreground text-sm">
              Aucun fan avec renouvellements
            </p>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="initial"
            animate="animate"
            className="space-y-1"
          >
            {fans.map((fan, index) => {
              const rank = index + 1
              const rankColor =
                rankColors[rank] ??
                "bg-muted text-muted-foreground border-transparent"

              return (
                <motion.div
                  key={fan._id}
                  variants={itemVariants}
                  className="flex items-center gap-3 rounded-lg p-2.5 transition-colors hover:bg-white/5"
                >
                  <Badge
                    variant="outline"
                    className={cn(
                      "h-7 w-7 shrink-0 justify-center rounded-full border p-0 text-xs font-bold",
                      rankColor,
                    )}
                  >
                    {rank}
                  </Badge>

                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={fan.image}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-muted text-xs">
                      {fan.name?.charAt(0) ?? "?"}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium">
                        {fan.name}
                      </span>
                      {fan.username && (
                        <span className="text-muted-foreground truncate text-xs">
                          @{fan.username}
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      {formatCurrency(fan.totalSpent, "XAF")} dépensés
                    </p>
                  </div>

                  <span className="text-muted-foreground shrink-0 text-xs">
                    {fan.renewalCount} renouvellement
                    {fan.renewalCount > 1 ? "s" : ""}
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
