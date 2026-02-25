import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { toast } from "sonner"
import {
  simulateSubscriptionPayment,
  simulateTipPayment,
} from "@/actions/simulate-payment"
import { isPaymentTestMode } from "@/lib/config/payment-test"
import { PaymentData, initializeCinetPayPayment } from "@/lib/services/cinetpay"

export const useCinetpayPayment = () => {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const processPayment = async (paymentData: PaymentData) => {
    startTransition(async () => {
      // Test mode: simulate payment without calling CinetPay
      if (isPaymentTestMode()) {
        try {
          const isTip = paymentData.customFields?.type === "tip"

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
                  (paymentData.customFields?.action as
                    | "subscribe"
                    | "renew") || "subscribe",
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

      // Production: call CinetPay
      const result = await initializeCinetPayPayment(paymentData)

      if (result.success && result.payment_url) {
        router.push(result.payment_url)
      } else {
        toast.error("Une erreur s'est produite !", {
          description:
            result.error ||
            "Veuillez vérifier votre connexion internet et réessayer",
        })
      }
    })
  }

  return {
    processPayment,
    isPending,
  }
}
