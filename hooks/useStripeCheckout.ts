"use client"

import { useState } from "react"

type Payload = {
  creatorId: string
  subscriberId: string
  creatorUsername: string
  amount: number
  action: "subscribe" | "renew"
}

export const useStripeCheckout = () => {
  const [isPending, setIsPending] = useState(false)

  const checkout = async (payload: Payload) => {
    setIsPending(true)
    try {
      const res = await fetch("/api/stripe/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Erreur avec Stripe")
      if (data?.url) {
        window.location.href = data.url
      }
    } catch (e) {
      console.error(e)
      throw e
    } finally {
      setIsPending(false)
    }
  }

  return { checkout, isPending }
}
