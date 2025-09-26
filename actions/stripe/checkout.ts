"use server"

import { auth, currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { stripe } from "@/lib/stripe"

const baseUrl =
  process.env.NODE_ENV === "production"
    ? "https://fantribe.io"
    : "http://localhost:3000"

export async function startStripeCheckout(params: {
  creatorId: string
  subscriberId: string
  creatorUsername: string
  amount: number
  action: "subscribe" | "renew"
}) {
  const { userId } = await auth()
  const user = await currentUser()

  if (!userId || !user) {
    return { error: "Unauthorized" }
  }

  const currency = "xaf"
  const zeroDecimal = ["xaf", "xof", "jpy", "krw"].includes(currency)
  const amountUnit = zeroDecimal
    ? params.amount
    : Math.round(params.amount * 100)

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    client_reference_id: userId,
    customer_email: user.emailAddresses?.[0]?.emailAddress,
    line_items: [
      {
        price: process.env.STRIPE_PRICE_ID,
        quantity: 1,
      },
    ],
    metadata: {
      creatorId: params.creatorId,
      subscriberId: params.subscriberId,
      creatorUsername: params.creatorUsername,
      action: params.action,
    },
    success_url: `${baseUrl}/payment/merci?provider=stripe&session_id={CHECKOUT_SESSION_ID}&username=${params.creatorUsername}`,
    cancel_url: `${baseUrl}/payment/cancelled?provider=stripe&reason=cancelled&username=${params.creatorUsername}`,
  })

  if (session.url) {
    redirect(session.url)
  }
}
