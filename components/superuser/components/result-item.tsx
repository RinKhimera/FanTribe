"use client"

import { cn } from "@/lib/utils"

interface ResultItemProps {
  isSelected: boolean
  onClick: () => void
  children: React.ReactNode
}

export function ResultItem({ isSelected, onClick, children }: ResultItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5",
        "text-left transition-colors",
        isSelected ? "bg-primary/10 text-primary" : "hover:bg-muted"
      )}
    >
      {children}
    </button>
  )
}
