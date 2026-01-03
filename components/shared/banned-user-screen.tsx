"use client"

import { useClerk } from "@clerk/nextjs"
import { Ban, Calendar, Clock, LogOut, Mail, ShieldX } from "lucide-react"
import { motion } from "motion/react"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/formatters/date"
import { cn } from "@/lib/utils"

interface BannedUserScreenProps {
  banInfo: {
    type: "temporary" | "permanent"
    reason?: string
    bannedAt?: number
    expiresAt?: number
  }
}

export const BannedUserScreen = ({ banInfo }: BannedUserScreenProps) => {
  const { signOut } = useClerk()

  const isTemporary = banInfo.type === "temporary"
  const bannedDate = banInfo.bannedAt ? formatDate(banInfo.bannedAt) : null
  const expiresDate = banInfo.expiresAt ? formatDate(banInfo.expiresAt) : null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background">
      {/* Background pattern */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-destructive/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-destructive/5 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-destructive/3 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-md px-6 text-center">
        {/* Icon */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 20,
            delay: 0.1,
          }}
          className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-destructive/10 ring-4 ring-destructive/20"
        >
          <ShieldX className="h-12 w-12 text-destructive" />
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-3 text-2xl font-bold tracking-tight text-foreground"
        >
          Compte suspendu
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8 text-muted-foreground"
        >
          {isTemporary
            ? "Votre compte a été temporairement suspendu."
            : "Votre compte a été définitivement suspendu."}
        </motion.p>

        {/* Info card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8 rounded-2xl border border-border/50 bg-card/50 p-6 text-left backdrop-blur-sm"
        >
          {/* Ban type */}
          <div className="mb-4 flex items-center gap-3">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg",
                isTemporary ? "bg-amber-500/10" : "bg-destructive/10"
              )}
            >
              <Ban
                className={cn(
                  "h-5 w-5",
                  isTemporary ? "text-amber-500" : "text-destructive"
                )}
              />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Type de suspension
              </p>
              <p
                className={cn(
                  "text-sm",
                  isTemporary ? "text-amber-500" : "text-destructive"
                )}
              >
                {isTemporary ? "Temporaire" : "Permanente"}
              </p>
            </div>
          </div>

          {/* Reason */}
          {banInfo.reason && (
            <div className="mb-4 border-t border-border/50 pt-4">
              <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Motif
              </p>
              <p className="text-sm text-foreground">{banInfo.reason}</p>
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4 border-t border-border/50 pt-4">
            {bannedDate && (
              <div className="flex items-start gap-2">
                <Calendar className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Suspendu le</p>
                  <p className="text-sm font-medium text-foreground">
                    {bannedDate}
                  </p>
                </div>
              </div>
            )}
            {isTemporary && expiresDate && (
              <div className="flex items-start gap-2">
                <Clock className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Expire le</p>
                  <p className="text-sm font-medium text-foreground">
                    {expiresDate}
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col gap-3"
        >
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => window.open("mailto:support@fantribe.io", "_blank")}
          >
            <Mail className="h-4 w-4" />
            Contacter le support
          </Button>
          <Button
            variant="ghost"
            className="w-full gap-2 text-muted-foreground hover:text-foreground"
            onClick={() => signOut({ redirectUrl: "/" })}
          >
            <LogOut className="h-4 w-4" />
            Se déconnecter
          </Button>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 text-xs text-muted-foreground"
        >
          Si vous pensez qu&apos;il s&apos;agit d&apos;une erreur, contactez notre équipe de
          support.
        </motion.p>
      </div>
    </div>
  )
}
