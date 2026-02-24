"use client"

import { Check, Globe, Lock } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

export type PostVisibility = "public" | "subscribers_only"

interface VisibilitySelectorProps {
  value: PostVisibility
  onChange: (value: PostVisibility) => void
}

const options = [
  {
    value: "public" as const,
    label: "Tout le monde",
    description: "Visible par tous",
    icon: Globe,
    iconColor: "text-green-500",
  },
  {
    value: "subscribers_only" as const,
    label: "Fans uniquement",
    description: "Réservé aux abonnés",
    icon: Lock,
    iconColor: "text-primary",
  },
]

export const VisibilitySelector = ({
  value,
  onChange,
}: VisibilitySelectorProps) => {
  const [open, setOpen] = useState(false)
  const current = options.find((o) => o.value === value) ?? options[0]
  const CurrentIcon = current.icon

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn(
                "size-9 rounded-full",
                "text-muted-foreground",
                "hover:bg-primary/10 hover:text-primary",
                "transition-all duration-200",
              )}
              aria-label={current.label}
            >
              <CurrentIcon className={cn("size-5", current.iconColor)} />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        {!open && (
          <TooltipContent side="bottom" sideOffset={8}>
            <p>{current.label}</p>
          </TooltipContent>
        )}
      </Tooltip>

      <PopoverContent className="w-56 p-1.5" align="start" sideOffset={8}>
        {options.map((option) => {
          const Icon = option.icon
          const isSelected = value === option.value
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value)
                setOpen(false)
              }}
              className={cn(
                "flex w-full items-center gap-3 rounded-md px-3 py-2.5",
                "text-left text-sm transition-colors duration-150",
                "cursor-pointer hover:bg-accent",
                isSelected && "bg-accent/50",
              )}
            >
              <Icon className={cn("size-4 shrink-0", option.iconColor)} />
              <div className="min-w-0 flex-1">
                <div className="font-medium">{option.label}</div>
                <div className="text-muted-foreground text-xs">
                  {option.description}
                </div>
              </div>
              {isSelected && (
                <Check className="text-primary size-4 shrink-0" />
              )}
            </button>
          )
        })}
      </PopoverContent>
    </Popover>
  )
}
