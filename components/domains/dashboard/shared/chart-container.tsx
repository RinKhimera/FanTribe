"use client"

import { motion } from "motion/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface ChartContainerProps {
  title: string
  subtitle?: string
  isLoading?: boolean
  isEmpty?: boolean
  emptyMessage?: string
  children: React.ReactNode
  className?: string
  headerAction?: React.ReactNode
}

export function ChartContainer({
  title,
  subtitle,
  isLoading = false,
  isEmpty = false,
  emptyMessage = "Pas encore de données",
  children,
  className,
  headerAction,
}: ChartContainerProps) {
  return (
    <motion.div
      variants={{
        initial: { opacity: 0, y: 10 },
        animate: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.3, ease: "easeOut" },
        },
      }}
    >
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-base font-semibold tracking-tight">
              {title}
            </CardTitle>
            {subtitle && (
              <p className="text-muted-foreground mt-1 text-xs">{subtitle}</p>
            )}
          </div>
          {headerAction}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-[200px] w-full rounded-lg" />
            </div>
          ) : isEmpty ? (
            <div className="flex h-[200px] items-center justify-center">
              <p className="text-muted-foreground text-sm">{emptyMessage}</p>
            </div>
          ) : (
            children
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
