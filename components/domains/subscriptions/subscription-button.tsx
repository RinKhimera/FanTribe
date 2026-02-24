"use client"

import { motion } from "motion/react"
import { Check, Crown, LoaderCircle } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Doc } from "@/convex/_generated/dataModel"
import { cn } from "@/lib/utils"
import { SubscriptionUnified, SubscriptionType } from "./subscription-unified"

type SubscriptionStatus = {
  status: "pending" | "active" | "canceled" | "expired"
}

type CanSubscribeResult = {
  canSubscribe: boolean
  reason?: string
}

type ButtonState = "subscribe" | "subscribed" | "pending" | "renew"

type SubscriptionButtonProps = {
  userProfile: Doc<"users">
  subscriptionStatus: SubscriptionStatus | null | undefined
  canSubscribeCheck?: CanSubscribeResult | null | undefined
  className?: string
}

function getButtonState(
  subscriptionStatus: SubscriptionStatus | null | undefined,
): ButtonState {
  if (!subscriptionStatus) return "subscribe"

  switch (subscriptionStatus.status) {
    case "active":
      return "subscribed"
    case "pending":
      return "pending"
    case "expired":
      return "renew"
    case "canceled":
      return "subscribe"
    default:
      return "subscribe"
  }
}

function getModalType(state: ButtonState): SubscriptionType {
  switch (state) {
    case "subscribed":
      return "unsubscribe"
    case "renew":
      return "renew"
    default:
      return "subscribe"
  }
}

const buttonConfig: Record<
  ButtonState,
  {
    text: string
    showPrice: boolean
    canHover: boolean
  }
> = {
  subscribe: {
    text: "S'ABONNER",
    showPrice: true,
    canHover: true,
  },
  subscribed: {
    text: "ABONNÉ",
    showPrice: false,
    canHover: true,
  },
  pending: {
    text: "EN ATTENTE",
    showPrice: false,
    canHover: false,
  },
  renew: {
    text: "RENOUVELER",
    showPrice: true,
    canHover: true,
  },
}

export const SubscriptionButton = ({
  userProfile,
  subscriptionStatus,
  className,
}: SubscriptionButtonProps) => {
  const [dialogOpen, setDialogOpen] = useState(false)

  const state = getButtonState(subscriptionStatus)
  const config = buttonConfig[state]
  const modalType = getModalType(state)

  const handleClick = () => {
    if (state === "pending") {
      toast.info("Votre abonnement est en attente de validation", {
        description: "Vous recevrez une notification une fois le paiement confirmé",
      })
      return
    }
    setDialogOpen(true)
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        {state === "subscribe" && (
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.15 }}
          >
            <Button
              onClick={handleClick}
              className={cn(
                "relative w-full overflow-hidden rounded-2xl px-6 py-6 text-lg font-semibold",
                "bg-gradient-to-r from-primary via-primary/95 to-primary/85",
                "shadow-lg shadow-primary/25",
                "transition-shadow duration-300 hover:shadow-xl hover:shadow-primary/35",
                className,
              )}
            >
              {/* Shimmer effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                initial={{ x: "-100%" }}
                animate={{ x: "200%" }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 3,
                  ease: "easeInOut",
                }}
              />

              <div className="relative flex w-full items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Crown className="h-5 w-5" aria-hidden="true" />
                  <span>{config.text}</span>
                </div>
                <span className="font-bold tabular-nums">1000 XAF</span>
              </div>
            </Button>
          </motion.div>
        )}

        {state === "subscribed" && (
          <motion.div
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            transition={{ duration: 0.15 }}
          >
            <Button
              onClick={handleClick}
              variant="outline"
              className={cn(
                "relative w-full overflow-hidden rounded-full px-6 py-6 text-lg font-semibold",
                "border-2 border-primary/40 bg-primary/5 backdrop-blur-sm",
                "transition-colors duration-300 hover:border-primary/60 hover:bg-primary/10",
                className,
              )}
            >
              {/* Subtle glow pulse */}
              <motion.div
                className="absolute inset-0 rounded-full bg-primary/10"
                animate={{
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />

              <div className="relative flex w-full items-center justify-center gap-2.5">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                  <Check className="h-3 w-3 text-primary-foreground" aria-hidden="true" />
                </div>
                <span>{config.text}</span>
                <Crown className="h-4 w-4 text-primary/70" aria-hidden="true" />
              </div>
            </Button>
          </motion.div>
        )}

        {state === "pending" && (
          <Button
            onClick={handleClick}
            variant="outline"
            disabled
            className={cn(
              "w-full cursor-wait rounded-full px-6 py-6 text-lg font-semibold",
              "border-2 border-muted bg-muted/30 backdrop-blur-sm",
              "text-muted-foreground",
              className,
            )}
          >
            <div className="flex w-full items-center justify-center gap-2.5">
              <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />
              <span>{config.text}</span>
            </div>
          </Button>
        )}

        {state === "renew" && (
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.15 }}
          >
            <Button
              onClick={handleClick}
              variant="outline"
              className={cn(
                "relative w-full overflow-hidden rounded-full px-6 py-6 text-lg font-semibold",
                "border-2 border-primary bg-transparent",
                "text-primary transition-colors duration-300 hover:bg-primary/10",
                className,
              )}
            >
              {/* Border glow animation */}
              <motion.div
                className="pointer-events-none absolute inset-0 rounded-full"
                animate={{
                  boxShadow: [
                    "0 0 0 0 transparent",
                    "0 0 12px 2px color-mix(in oklch, var(--primary) 30%, transparent)",
                    "0 0 0 0 transparent",
                  ],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />

              <div className="relative flex w-full items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Crown className="h-5 w-5" aria-hidden="true" />
                  <span>{config.text}</span>
                </div>
                <span className="font-bold tabular-nums">1000 XAF</span>
              </div>
            </Button>
          </motion.div>
        )}
      </motion.div>

      <SubscriptionUnified
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        creator={userProfile}
        type={modalType}
      />
    </>
  )
}
