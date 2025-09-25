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
        price_data: {
          currency,
          unit_amount: amountUnit,
          product_data: {
            name:
              params.action === "renew"
                ? "Renouvellement abonnement"
                : "Abonnement mensuel",
            description: `@${params.creatorUsername}`,
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      creatorId: params.creatorId,
      subscriberId: params.subscriberId,
      creatorUsername: params.creatorUsername,
      action: params.action,
    },
    success_url: `${baseUrl}/payment-check?provider=stripe&status=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/payment-check?provider=stripe&status=cancel`,
  })

  if (session.url) {
    redirect(session.url)
  }
}
