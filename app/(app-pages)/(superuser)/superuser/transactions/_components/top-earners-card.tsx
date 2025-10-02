"use client"

import { ReactNode } from "react"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface Earner {
  creatorId: string
  creatorName: string
  creatorUsername?: string
  totalAmount: number
  transactionCount: number
  currency: string
}

interface TopEarnersCardProps {
  title: string
  description: string
  earners: Earner[]
  icon: ReactNode
  isLoading: boolean
}

export function TopEarnersCard({
  title,
  description,
  earners,
  icon,
  isLoading,
}: TopEarnersCardProps) {
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount)
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex animate-pulse items-center gap-3">
                <div className="bg-muted h-10 w-10 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="bg-muted h-4 w-32 rounded"></div>
                  <div className="bg-muted h-3 w-24 rounded"></div>
                </div>
                <div className="bg-muted h-6 w-20 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (earners.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground py-8 text-center text-sm">
            Aucune donnée disponible pour cette période
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {earners.map((earner, index) => (
            <div
              key={earner.creatorId}
              className="hover:bg-muted/50 flex items-start gap-3 rounded-lg p-3 transition-colors"
            >
              {/* Ranking badge */}
              <div className="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold">
                {index + 1}
              </div>

              {/* Creator info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-medium">{earner.creatorName}</p>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  {earner.creatorUsername && (
                    <span className="text-muted-foreground text-xs">
                      @{earner.creatorUsername}
                    </span>
                  )}
                  <Badge
                    variant="outline"
                    className="hidden text-xs sm:inline-flex"
                  >
                    {earner.transactionCount} transaction
                    {earner.transactionCount > 1 ? "s" : ""}
                  </Badge>
                </div>
              </div>

              {/* Amount */}
              <div className="text-right">
                <p className="text-lg font-bold">
                  {formatCurrency(earner.totalAmount, earner.currency)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
