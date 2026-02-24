"use client"

import { motion } from "motion/react"
import { Lock, MessageCircleOff, RefreshCw } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Doc } from "@/convex/_generated/dataModel"
import { SubscriptionUnified } from "@/components/domains/subscriptions/subscription-unified"

type LockedConversationOverlayProps = {
  reason?: "subscription_expired" | "admin_blocked" | string
  creator?: Doc<"users"> | null
  currentUser?: Doc<"users"> | null
}

export const LockedConversationOverlay = ({
  reason,
  creator,
  currentUser,
}: LockedConversationOverlayProps) => {
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false)

  const isExpired = reason === "subscription_expired"
  const isBlocked = reason === "admin_blocked"

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-md"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ delay: 0.1, type: "spring", damping: 20 }}
          className="mx-4 max-w-sm"
        >
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/80 p-6 shadow-2xl backdrop-blur-xl">
            {/* Gradient decoration */}
            <div className="absolute -right-10 -top-10 size-32 rounded-full bg-linear-to-br from-amber-500/20 to-orange-500/10 blur-3xl" />
            <div className="absolute -bottom-10 -left-10 size-32 rounded-full bg-linear-to-tr from-red-500/10 to-amber-500/10 blur-3xl" />

            <div className="relative space-y-4">
              {/* Icon */}
              <div className="flex justify-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", damping: 12 }}
                  className={`flex size-16 items-center justify-center rounded-full ${
                    isBlocked
                      ? "bg-destructive/20"
                      : "bg-linear-to-br from-amber-500/20 to-orange-500/20"
                  }`}
                >
                  {isBlocked ? (
                    <MessageCircleOff size={28} className="text-destructive" aria-hidden="true" />
                  ) : (
                    <Lock size={28} className="text-amber-500" aria-hidden="true" />
                  )}
                </motion.div>
              </div>

              {/* Title */}
              <h3 className="text-center text-xl font-semibold">
                {isBlocked
                  ? "Conversation bloquée"
                  : "Abonnement messagerie expiré"}
              </h3>

              {/* Description */}
              <p className="text-center text-sm text-muted-foreground">
                {isBlocked
                  ? "Cette conversation a été bloquée par un administrateur. Vous ne pouvez plus envoyer ni recevoir de messages."
                  : "Votre abonnement messagerie a expiré. Renouvelez pour continuer à discuter avec ce créateur."}
              </p>

              {/* Action */}
              {isExpired && creator && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Button
                    onClick={() => setShowSubscriptionDialog(true)}
                    className="w-full gap-2 bg-linear-to-r from-amber-500 to-orange-500 text-black hover:from-amber-400 hover:to-orange-400"
                  >
                    <RefreshCw size={18} />
                    Renouveler l&apos;abonnement
                  </Button>
                </motion.div>
              )}

              {/* Price info */}
              {isExpired && (
                <p className="text-center text-xs text-muted-foreground">
                  2 000 XAF pour 2 semaines d&apos;accès
                </p>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Subscription dialog - TODO: Add accessType support to SubscriptionUnified for messaging_access */}
      {creator && currentUser && (
        <SubscriptionUnified
          isOpen={showSubscriptionDialog}
          onClose={() => setShowSubscriptionDialog(false)}
          type="subscribe"
          creator={creator}
          currentUser={currentUser}
        />
      )}
    </>
  )
}
