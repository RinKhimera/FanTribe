"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { containerVariants, itemVariants } from "@/lib/animations"
import { formatCustomTimeAgo, pluralize } from "@/lib/formatters"
import { cn } from "@/lib/utils"
import { Doc } from "@/convex/_generated/dataModel"

type SubscriberEntry = {
  _id: string
  _creationTime: number
  status: string
  startDate: number
  endDate: number
  renewalCount: number
  subscriberUser: Doc<"users"> | null | undefined
}

interface SubscriberListProps {
  subscribers: SubscriberEntry[]
  now: number
}

type FilterType = "all" | "active" | "expired"

const filterTabs: { value: FilterType; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "active", label: "Actifs" },
  { value: "expired", label: "Expirés" },
]

export const SubscriberList = ({ subscribers, now }: SubscriberListProps) => {
  const [filter, setFilter] = useState<FilterType>("all")

  const filtered =
    filter === "all"
      ? subscribers
      : subscribers.filter((s) => s.status === filter)

  const sorted = [...filtered].sort(
    (a, b) => b._creationTime - a._creationTime,
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">
            Liste des abonnés
          </CardTitle>
          <span className="text-muted-foreground text-sm">
            {filtered.length} {pluralize(filtered.length, "résultat")}
          </span>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 pt-2">
          {filterTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                filter === tab.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-white/5",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center text-sm">
            Aucun abonné dans cette catégorie
          </p>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="initial"
            animate="animate"
            className="max-h-[400px] space-y-1 overflow-y-auto"
          >
            {sorted.map((sub) => {
              const user = sub.subscriberUser
              if (!user) return null
              const isActive = sub.status === "active"
              const daysLeft = isActive
                ? Math.max(
                    0,
                    Math.ceil(
                      (sub.endDate - now) / (1000 * 60 * 60 * 24),
                    ),
                  )
                : 0

              return (
                <motion.div
                  key={sub._id}
                  variants={itemVariants}
                  className="flex items-center gap-3 rounded-lg p-2.5 transition-colors hover:bg-white/5"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={user.image}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-muted text-xs">
                      {user.name?.charAt(0) ?? "?"}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium">
                        {user.name}
                      </span>
                      {user.username && (
                        <span className="text-muted-foreground truncate text-xs">
                          @{user.username}
                        </span>
                      )}
                    </div>
                    <div className="text-muted-foreground mt-0.5 flex items-center gap-2 text-xs">
                      <span>
                        Depuis {formatCustomTimeAgo(sub._creationTime)}
                      </span>
                      {sub.renewalCount > 0 && (
                        <span>• {sub.renewalCount} {pluralize(sub.renewalCount, "renouvellement")}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {isActive && daysLeft <= 7 && (
                      <span className="text-xs text-amber-500">
                        {daysLeft}j restants
                      </span>
                    )}
                    <Badge
                      variant={isActive ? "default" : "outline"}
                      className={cn(
                        "text-xs",
                        isActive
                          ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                          : "text-muted-foreground",
                      )}
                    >
                      {isActive ? "Actif" : "Expiré"}
                    </Badge>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </CardContent>
    </Card>
  )
}
