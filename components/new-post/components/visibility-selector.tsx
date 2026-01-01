"use client"

import { Globe, Lock } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

export type PostVisibility = "public" | "subscribers_only"

interface VisibilitySelectorProps {
  value: PostVisibility
  onChange: (value: PostVisibility) => void
}

export const VisibilitySelector = ({
  value,
  onChange,
}: VisibilitySelectorProps) => {
  return (
    <Select
      defaultValue="public"
      value={value}
      onValueChange={(v) => onChange(v as PostVisibility)}
    >
      <SelectTrigger
        className={cn(
          "h-10 w-auto rounded-full bg-transparent",
          "border-border hover:bg-muted/50",
          "transition-all duration-200"
        )}
      >
        {value === "public" ? (
          <div className="flex items-center gap-2">
            <Globe className="size-4 text-green-500" />
            <span className="hidden sm:inline text-sm">Tout le monde</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Lock className="size-4 text-primary" />
            <span className="hidden sm:inline text-sm">Fans uniquement</span>
          </div>
        )}
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="public">
          <div className="flex items-center gap-2">
            <Globe className="size-4 text-green-500" />
            <span>Tout le monde</span>
          </div>
        </SelectItem>
        <SelectItem value="subscribers_only">
          <div className="flex items-center gap-2">
            <Lock className="size-4 text-primary" />
            <span>Fans uniquement</span>
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  )
}
