"use client"

import { Flame } from "lucide-react"
import { Button } from "@/components/ui/button"
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
  const label = value
    ? "Contenu marqué comme adulte (+18)"
    : "Marquer comme contenu adulte (+18)"

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          role="switch"
          aria-checked={value}
          aria-label={label}
          disabled={disabled}
          onClick={() => onChange(!value)}
          className={cn(
            "size-9 rounded-full",
            "transition-all duration-200",
            !value && [
              "text-muted-foreground",
              "hover:bg-orange-500/10 hover:text-orange-500",
            ],
            value && [
              "bg-orange-500/15 text-orange-500",
              "hover:bg-orange-500/20",
              "shadow-[0_0_12px_rgba(249,115,22,0.15)]",
            ],
          )}
        >
          <Flame
            className={cn(
              "size-5 transition-all duration-200",
              value && "drop-shadow-[0_0_4px_rgba(249,115,22,0.5)]",
            )}
          />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={8}>
        <p>{label}</p>
      </TooltipContent>
    </Tooltip>
  )
}
