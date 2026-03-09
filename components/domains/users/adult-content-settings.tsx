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
    currentUser.allowAdultContent ?? false,
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
            : "Contenu adulte masqué de votre fil",
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
          <button className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm transition-colors">
            <ShieldAlert className="size-4" aria-hidden="true" />
            Contenu adulte
          </button>
        )}
      </DialogTrigger>

      <DialogContent className="overflow-hidden sm:max-w-md">
        {/* Decorative gradient header */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-linear-to-b from-orange-500/10 to-transparent" />

        <DialogHeader className="relative">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex size-10 items-center justify-center rounded-full",
                "bg-orange-500/10 ring-1 ring-orange-500/20",
              )}
            >
              <Flame className="size-5 text-orange-500" aria-hidden="true" />
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
              "flex w-full items-center justify-between gap-4 rounded-xl p-4",
              "border transition-[background-color,border-color] duration-300",
              "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
              "disabled:cursor-not-allowed disabled:opacity-70",
              localValue
                ? "border-orange-500/30 bg-orange-500/5 focus-visible:ring-orange-500"
                : "border-border bg-muted/30 hover:bg-muted/50 focus-visible:ring-muted-foreground",
            )}
          >
            <div className="flex flex-col items-start gap-1">
              <span className="font-medium">Afficher le contenu adulte</span>
              <span className="text-muted-foreground text-left text-sm">
                {localValue
                  ? "Le contenu +18 public apparaît dans votre fil"
                  : "Le contenu +18 public est masqué de votre fil"}
              </span>
            </div>

            {/* Custom Toggle Switch */}
            <div
              className={cn(
                "relative h-7 w-12 shrink-0 rounded-full transition-colors duration-300",
                "ring-1 ring-inset",
                localValue
                  ? "bg-orange-500 ring-orange-600/20"
                  : "bg-muted ring-border",
              )}
            >
              {/* Track glow when active */}
              {localValue && (
                <div className="absolute inset-0 rounded-full bg-orange-500 opacity-40 blur-md" />
              )}

              {/* Thumb */}
              <div
                className={cn(
                  "absolute top-0.5 size-6 rounded-full transition-[left] duration-300",
                  "bg-white shadow-md",
                  "flex items-center justify-center",
                  localValue ? "left-[22px]" : "left-0.5",
                )}
              >
                {isPending ? (
                  <Loader2
                    className="text-muted-foreground size-3 animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <Flame
                    className={cn(
                      "size-3 transition-colors duration-300",
                      localValue
                        ? "text-orange-500"
                        : "text-muted-foreground/50",
                    )}
                    aria-hidden="true"
                  />
                )}
              </div>
            </div>
          </button>

          {/* Info Section */}
          <div
            className={cn(
              "flex gap-3 rounded-lg p-3",
              "bg-muted/50 border-border/50 border",
            )}
          >
            <ShieldAlert
              className="text-muted-foreground mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />
            <div className="space-y-2">
              <p className="text-muted-foreground text-xs leading-relaxed">
                Ce paramètre affecte uniquement le contenu public marqué comme
                adulte dans votre fil d&apos;actualité. Le contenu des créateurs
                auxquels vous êtes abonné reste toujours visible.
              </p>
              <p className="text-xs font-medium text-orange-500/90">
                En activant cette option, vous confirmez avoir 18 ans ou plus.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
