"use client"

import { cn } from "@/lib/utils"

interface ResultSectionProps {
  title: string
  icon: React.ElementType
  color: "blue" | "orange" | "rose"
  children: React.ReactNode
}

const colorClasses = {
  blue: "text-blue-500",
  orange: "text-orange-500",
  rose: "text-rose-500",
}

export function ResultSection({
  title,
  icon: Icon,
  color,
  children,
}: ResultSectionProps) {
  return (
    <div className="mb-2 last:mb-0">
      <div className="mb-1 flex items-center gap-1.5 px-2">
        <Icon className={cn("h-3 w-3", colorClasses[color])} />
        <span className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">
          {title}
        </span>
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  )
}
