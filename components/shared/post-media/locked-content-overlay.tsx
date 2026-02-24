"use client"

import { Lock, Sparkles, Image as ImageIcon, Film } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface LockedContentOverlayProps {
  mediaCount?: number
  authorUsername?: string
  onRequireSubscribe: () => void
}

export const LockedContentOverlay = ({
  mediaCount = 1,
  authorUsername,
  onRequireSubscribe,
}: LockedContentOverlayProps) => {
  return (
    <div
      className={cn(
        "relative mt-3 w-full overflow-hidden rounded-2xl",
        "aspect-video",
      )}
    >
      {/* SECURITE: Gradient placeholder uniquement - pas d'image réelle */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/30 to-primary/40" />

      {/* Premium overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />

      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div
          className="h-full w-full"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Content card */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6">
        <div className="glass-premium p-8 text-center max-w-sm">
          {/* Lock icon */}
          <div
            className={cn(
              "mx-auto mb-5 flex size-16 items-center justify-center rounded-full",
              "bg-primary",
            )}
          >
            <Lock aria-hidden="true" className="size-7 text-primary-foreground" />
          </div>

          {/* Title */}
          <h3 className="mb-2 text-xl font-bold tracking-tight text-foreground">
            Contenu Exclusif
          </h3>

          <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
            Ce contenu est réservé aux abonnés de{" "}
            <span className="font-semibold text-primary">
              @{authorUsername}
            </span>
          </p>

          {/* Media count indicator */}
          {mediaCount > 0 && (
            <div className="mb-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              {mediaCount === 1 ? (
                <ImageIcon aria-hidden="true" className="size-3.5" />
              ) : (
                <Film aria-hidden="true" className="size-3.5" />
              )}
              <span>
                {mediaCount} {mediaCount === 1 ? "média" : "médias"} exclusif
                {mediaCount > 1 ? "s" : ""}
              </span>
            </div>
          )}

          <Button
            size="lg"
            className={cn(
              "rounded-full px-8 h-11",
              "font-semibold tracking-wide",
            )}
            onClick={(e) => {
              e.stopPropagation()
              onRequireSubscribe()
            }}
          >
            <Sparkles aria-hidden="true" className="mr-2 size-4" />
            S&apos;abonner
          </Button>
        </div>
      </div>
    </div>
  )
}
