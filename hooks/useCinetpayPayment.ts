import { useAction } from "convex/react"
import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { toast } from "sonner"
import {
  simulateSubscriptionPayment,
  simulateTipPayment,
} from "@/actions/simulate-payment"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { isPaymentTestMode } from "@/lib/config/payment-test"

export type PaymentData = {
  creatorId: string
  subscriberId: string
  creatorUsername?: string
  amount?: number
  description?: string
  customFields?: Record<string, string>
}

export const useCinetpayPayment = () => {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const initiateSubscription = useAction(api.cinetpay.initiateSubscription)

  const processPayment = async (paymentData: PaymentData) => {
    startTransition(async () => {
      const isTip = paymentData.customFields?.type === "tip"

      if (isPaymentTestMode()) {
        try {
          const result = isTip
            ? await simulateTipPayment({
                senderId:
                  paymentData.customFields?.senderId ||
                  paymentData.subscriberId,
                creatorId: paymentData.creatorId,
                creatorUsername: paymentData.creatorUsername || "",
                amount: paymentData.amount || 500,
                tipMessage: paymentData.customFields?.tipMessage || undefined,
                context:
                  (paymentData.customFields?.tipContext as
                    | "post"
                    | "profile"
                    | "message") || undefined,
                postId: paymentData.customFields?.postId || undefined,
                conversationId:
                  paymentData.customFields?.conversationId || undefined,
              })
            : await simulateSubscriptionPayment({
                creatorId: paymentData.creatorId,
                subscriberId: paymentData.subscriberId,
                creatorUsername: paymentData.creatorUsername || "",
                amount: paymentData.amount,
                action:
                  (paymentData.customFields?.action as "subscribe" | "renew") ||
                  "subscribe",
              })

          if (result.redirectUrl) {
            router.push(result.redirectUrl)
          } else {
            toast.error("Simulation de paiement échouée")
          }
        } catch (error) {
          console.error("Test payment simulation error:", error)
          toast.error("Erreur lors de la simulation de paiement")
        }
        return
      }

      if (isTip) {
        toast.error("Mobile Money pour les pourboires bientôt disponible", {
          description: "Veuillez utiliser le paiement par carte.",
        })
        return
      }

      try {
        const result = await initiateSubscription({
          creatorId: paymentData.creatorId as Id<"users">,
        })
        router.push(result.paymentUrl)
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Erreur inconnue"
        toast.error("Une erreur s'est produite !", {
          description: message,
        })
      }
    })
  }

  return {
    processPayment,
    isPending,
  }
}
