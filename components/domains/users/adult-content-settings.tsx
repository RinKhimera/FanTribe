"use client"

import { useMutation } from "convex/react"
import { Flame, Loader2, ShieldAlert } from "lucide-react"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { api } from "@/convex/_generated/api"
import { Doc } from "@/convex/_generated/dataModel"
import { cn } from "@/lib/utils"

interface AdultContentSettingsProps {
  currentUser: Doc<"users">
  trigger?: React.ReactNode
}

export const AdultContentSettings = ({
  currentUser,
  trigger,
}: AdultContentSettingsProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [localValue, setLocalValue] = useState(
    currentUser.allowAdultContent ?? false
  )

  const updatePreference = useMutation(api.users.updateAdultContentPreference)

  const handleToggle = () => {
    const newValue = !localValue
    setLocalValue(newValue)

    startTransition(async () => {
      try {
        await updatePreference({ allowAdultContent: newValue })
        toast.success(
          newValue
            ? "Contenu adulte activé dans votre fil"
            : "Contenu adulte masqué de votre fil"
        )
      } catch {
        // Revert on error
        setLocalValue(!newValue)
        toast.error("Erreur lors de la mise à jour")
      }
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ShieldAlert className="size-4" />
            Contenu adulte
          </button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-md overflow-hidden">
        {/* Decorative gradient header */}
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-orange-500/10 to-transparent pointer-events-none" />

        <DialogHeader className="relative">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex size-10 items-center justify-center rounded-full",
                "bg-orange-500/10 ring-1 ring-orange-500/20"
              )}
            >
              <Flame className="size-5 text-orange-500" />
            </div>
            <div>
              <DialogTitle className="text-left">Contenu adulte</DialogTitle>
              <DialogDescription className="text-left">
                Gérez l&apos;affichage du contenu +18
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="relative space-y-6 pt-2">
          {/* Toggle Card */}
          <button
            type="button"
            onClick={handleToggle}
            disabled={isPending}
            className={cn(
              "w-full flex items-center justify-between gap-4 p-4 rounded-xl",
              "border transition-all duration-300",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
              "disabled:opacity-70 disabled:cursor-not-allowed",
              localValue
                ? "border-orange-500/30 bg-orange-500/5 focus-visible:ring-orange-500"
                : "border-border bg-muted/30 hover:bg-muted/50 focus-visible:ring-muted-foreground"
            )}
          >
            <div className="flex flex-col items-start gap-1">
              <span className="font-medium">
                Afficher le contenu adulte
              </span>
              <span className="text-sm text-muted-foreground text-left">
                {localValue
                  ? "Le contenu +18 public apparaît dans votre fil"
                  : "Le contenu +18 public est masqué de votre fil"}
              </span>
            </div>

            {/* Custom Toggle Switch */}
            <div
              className={cn(
                "relative shrink-0 h-7 w-12 rounded-full transition-all duration-300",
                "ring-1 ring-inset",
                localValue
                  ? "bg-orange-500 ring-orange-600/20"
                  : "bg-muted ring-border"
              )}
            >
              {/* Track glow when active */}
              {localValue && (
                <div className="absolute inset-0 rounded-full bg-orange-500 blur-md opacity-40" />
              )}

              {/* Thumb */}
              <div
                className={cn(
                  "absolute top-0.5 size-6 rounded-full transition-all duration-300",
                  "bg-white shadow-md",
                  "flex items-center justify-center",
                  localValue ? "left-[22px]" : "left-0.5"
                )}
              >
                {isPending ? (
                  <Loader2 className="size-3 text-muted-foreground animate-spin" />
                ) : (
                  <Flame
                    className={cn(
                      "size-3 transition-colors duration-300",
                      localValue ? "text-orange-500" : "text-muted-foreground/50"
                    )}
                  />
                )}
              </div>
            </div>
          </button>

          {/* Info Section */}
          <div
            className={cn(
              "flex gap-3 p-3 rounded-lg",
              "bg-muted/50 border border-border/50"
            )}
          >
            <ShieldAlert className="size-4 text-muted-foreground shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Ce paramètre affecte uniquement le contenu public marqué comme
                adulte dans votre fil d&apos;actualité. Le contenu des créateurs
                auxquels vous êtes abonné reste toujours visible.
              </p>
              <p className="text-xs text-orange-500/90 font-medium">
                En activant cette option, vous confirmez avoir 18 ans ou plus.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
