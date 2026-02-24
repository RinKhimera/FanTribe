"use server"

import { auth, currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { env } from "@/lib/config/env"
import { stripe } from "@/lib/services/stripe"

const baseUrl =
  env.NODE_ENV === "production"
    ? "https://fantribe.io"
    : "http://localhost:3000"

export async function startStripeCheckout(params: {
  creatorId: string
  subscriberId: string
  creatorUsername: string
  action: "subscribe" | "renew"
}) {
  const [{ userId }, user] = await Promise.all([auth(), currentUser()])

  if (!userId || !user) {
    return { error: "Unauthorized" }
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    client_reference_id: userId,
    customer_email: user.emailAddresses?.[0]?.emailAddress,
    line_items: [
      {
        price: env.STRIPE_PRICE_ID,
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
