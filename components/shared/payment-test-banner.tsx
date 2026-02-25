"use client"

import { FlaskConical } from "lucide-react"
import { isPaymentTestMode } from "@/lib/config/payment-test"

export const PaymentTestBanner = () => {
  if (!isPaymentTestMode()) return null

  return (
    <div className="sticky top-0 z-[100] flex items-center justify-center gap-2 bg-amber-500 px-3 py-1.5 text-xs font-semibold text-black">
      <FlaskConical className="h-3.5 w-3.5" aria-hidden="true" />
      MODE TEST PAIEMENT — Les paiements sont simulés
    </div>
  )
}
