"use client"

import { type LucideIcon, TrendingUp, TrendingDown } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

type ColorScheme = "blue" | "green" | "orange" | "red" | "purple"

interface SuperuserStatsCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  colorScheme?: ColorScheme
  isLoading?: boolean
  className?: string
}

const colorSchemes: Record<
  ColorScheme,
  {
    gradient: string
    iconBg: string
    iconColor: string
    trendPositive: string
    trendNegative: string
    accentBorder: string
  }
> = {
  blue: {
    gradient: "from-blue-500/10 via-cyan-500/5 to-transparent",
    iconBg: "bg-gradient-to-br from-blue-500 to-cyan-500",
    iconColor: "text-white",
    trendPositive: "text-emerald-600 bg-emerald-500/10",
    trendNegative: "text-rose-600 bg-rose-500/10",
    accentBorder: "border-l-blue-500",
  },
  green: {
    gradient: "from-emerald-500/10 via-teal-500/5 to-transparent",
    iconBg: "bg-gradient-to-br from-emerald-500 to-teal-500",
    iconColor: "text-white",
    trendPositive: "text-emerald-600 bg-emerald-500/10",
    trendNegative: "text-rose-600 bg-rose-500/10",
    accentBorder: "border-l-emerald-500",
  },
  orange: {
    gradient: "from-orange-500/10 via-amber-500/5 to-transparent",
    iconBg: "bg-gradient-to-br from-orange-500 to-amber-500",
    iconColor: "text-white",
    trendPositive: "text-emerald-600 bg-emerald-500/10",
    trendNegative: "text-rose-600 bg-rose-500/10",
    accentBorder: "border-l-orange-500",
  },
  red: {
    gradient: "from-rose-500/10 via-pink-500/5 to-transparent",
    iconBg: "bg-gradient-to-br from-rose-500 to-pink-500",
    iconColor: "text-white",
    trendPositive: "text-emerald-600 bg-emerald-500/10",
    trendNegative: "text-rose-600 bg-rose-500/10",
    accentBorder: "border-l-rose-500",
  },
  purple: {
    gradient: "from-violet-500/10 via-purple-500/5 to-transparent",
    iconBg: "bg-gradient-to-br from-violet-500 to-purple-500",
    iconColor: "text-white",
    trendPositive: "text-emerald-600 bg-emerald-500/10",
    trendNegative: "text-rose-600 bg-rose-500/10",
    accentBorder: "border-l-violet-500",
  },
}

export function SuperuserStatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  colorScheme = "blue",
  isLoading = false,
  className,
}: SuperuserStatsCardProps) {
  const scheme = colorSchemes[colorScheme]

  if (isLoading) {
    return (
      <Card className={cn("relative overflow-hidden p-5", className)}>
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-12 w-12 rounded-xl" />
        </div>
      </Card>
    )
  }

  return (
    <Card
      className={cn(
        "group relative overflow-hidden border-l-4 p-5",
        "transition-[box-shadow,transform] duration-300 ease-out",
        "hover:shadow-lg hover:-translate-y-0.5",
        scheme.accentBorder,
        className
      )}
    >
      {/* Gradient background overlay */}
      <div
        className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-60",
          "transition-opacity duration-300 group-hover:opacity-100",
          scheme.gradient
        )}
      />

      {/* Content */}
      <div className="relative z-10 flex items-start justify-between">
        {/* Text content */}
        <div className="space-y-1">
          {/* Title */}
          <p className="text-muted-foreground text-sm font-medium tracking-wide">
            {title}
          </p>

          {/* Value */}
          <div className="flex items-baseline gap-2">
            <p className="text-foreground text-3xl font-bold tracking-tight">
              {value}
            </p>

            {/* Trend indicator */}
            {trend && (
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold",
                  "animate-in fade-in slide-in-from-left-2 duration-300",
                  trend.isPositive ? scheme.trendPositive : scheme.trendNegative
                )}
              >
                {trend.isPositive ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {trend.value > 0 ? "+" : ""}
                {trend.value}%
              </span>
            )}
          </div>

          {/* Subtitle */}
          {subtitle && (
            <p className="text-muted-foreground/80 text-xs">{subtitle}</p>
          )}
        </div>

        {/* Icon */}
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
            "shadow-lg transition-transform duration-300",
            "group-hover:scale-110 group-hover:rotate-3",
            scheme.iconBg,
            scheme.iconColor
          )}
        >
          <Icon className="h-6 w-6" strokeWidth={2} />
        </div>
      </div>

      {/* Decorative corner accent */}
      <div
        className={cn(
          "absolute -bottom-8 -right-8 h-24 w-24 rounded-full opacity-10",
          "transition-transform duration-500 group-hover:scale-150",
          scheme.iconBg
        )}
      />
    </Card>
  )
}
