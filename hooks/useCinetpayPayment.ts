import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { toast } from "sonner"
import { PaymentData, initializeCinetPayPayment } from "@/lib/services/cinetpay"

export const useCinetpayPayment = () => {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const processPayment = async (paymentData: PaymentData) => {
    startTransition(async () => {
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
