"use client"

import { Flame } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface AdultContentToggleProps {
  value: boolean
  onChange: (value: boolean) => void
  disabled?: boolean
}

export const AdultContentToggle = ({
  value,
  onChange,
  disabled = false,
}: AdultContentToggleProps) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          role="switch"
          aria-checked={value}
          aria-label="Marquer comme contenu adulte"
          disabled={disabled}
          onClick={() => onChange(!value)}
          className={cn(
            "relative h-10 rounded-full px-3",
            "flex items-center gap-2",
            "border transition-all duration-300",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
            "disabled:pointer-events-none disabled:opacity-50",
            // Default state (unchecked)
            !value && [
              "border-border bg-transparent",
              "hover:bg-muted/50",
              "focus-visible:ring-muted-foreground",
            ],
            // Active state (checked)
            value && [
              "border-orange-500/50 bg-orange-500/10",
              "hover:bg-orange-500/15",
              "focus-visible:ring-orange-500",
              "shadow-[0_0_12px_rgba(249,115,22,0.15)]",
            ]
          )}
        >
          {/* Flame icon with animation */}
          <Flame
            className={cn(
              "size-4 transition-all duration-300",
              !value && "text-muted-foreground",
              value && [
                "text-orange-500",
                "drop-shadow-[0_0_4px_rgba(249,115,22,0.5)]",
              ]
            )}
          />

          {/* Label */}
          <span
            className={cn(
              "text-sm font-medium transition-colors duration-300",
              "hidden sm:inline",
              !value && "text-muted-foreground",
              value && "text-orange-500"
            )}
          >
            +18
          </span>

          {/* Mobile-only indicator dot when active */}
          {value && (
            <span
              className={cn(
                "absolute -top-0.5 -right-0.5 sm:hidden",
                "size-2 rounded-full bg-orange-500",
                "animate-pulse"
              )}
            />
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={8}>
        <p>
          {value
            ? "Contenu marqué comme adulte (+18)"
            : "Marquer comme contenu adulte (+18)"}
        </p>
      </TooltipContent>
    </Tooltip>
  )
}
