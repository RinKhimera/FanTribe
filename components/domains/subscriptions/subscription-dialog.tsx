"use client"

import { Crown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { UserProps } from "@/types"
import { SubscriptionUnified, SubscriptionType } from "./subscription-unified"

type SubscriptionDialogProps = {
  userProfile: UserProps
  type: SubscriptionType
}

/**
 * @deprecated Use SubscriptionUnified directly for new code
 * This component is kept for backward compatibility
 */
export const SubscriptionDialog = ({
  userProfile,
  type,
}: SubscriptionDialogProps) => {
  const getButtonConfig = () => {
    switch (type) {
      case "subscribe":
        return {
          triggerText: "S'ABONNER",
          triggerClass:
            "from-primary to-primary/80 mt-3 w-full justify-between rounded-2xl bg-linear-to-r text-lg font-semibold shadow-lg transition-shadow hover:shadow-xl",
          icon: <Crown className="h-5 w-5" aria-hidden="true" />,
        }
      case "renew":
        return {
          triggerText: "RENOUVELER",
          triggerClass:
            "border-primary mt-3 w-full justify-between rounded-3xl border-2 text-lg",
          icon: null,
        }
      case "unsubscribe":
        return {
          triggerText: "ABONNÉ",
          triggerClass:
            "border-muted mt-3 w-full justify-between rounded-3xl border-2 text-lg",
          icon: null,
        }
    }
  }

  const buttonConfig = getButtonConfig()

  return (
    <SubscriptionUnified
      creator={userProfile}
      type={type}
      trigger={
        <Button className={buttonConfig.triggerClass}>
          <div className="flex items-center gap-2">
            {buttonConfig.icon}
            {buttonConfig.triggerText}
          </div>
          <div className="font-bold">1000 XAF</div>
        </Button>
      }
    />
  )
}
