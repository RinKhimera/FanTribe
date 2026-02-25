"use server"

import { auth, currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { simulateSubscriptionPayment } from "@/actions/simulate-payment"
import { env } from "@/lib/config/env"
import {
  isPaymentTestForceFail,
  isPaymentTestMode,
} from "@/lib/config/payment-test"
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

  // Test mode: simulate payment without calling Stripe
  if (isPaymentTestMode()) {
    if (isPaymentTestForceFail()) {
      redirect(
        `/payment/result?status=failed&username=${params.creatorUsername}&reason=test_force_fail`,
      )
    }
    const result = await simulateSubscriptionPayment({
      creatorId: params.creatorId,
      subscriberId: params.subscriberId,
      creatorUsername: params.creatorUsername,
      action: params.action,
    })
    redirect(
      result.redirectUrl ||
        `/payment/result?status=failed&username=${params.creatorUsername}`,
    )
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
    success_url: `${baseUrl}/payment/result?status=success&provider=stripe&session_id={CHECKOUT_SESSION_ID}&username=${params.creatorUsername}`,
    cancel_url: `${baseUrl}/payment/result?status=failed&provider=stripe&reason=cancelled&username=${params.creatorUsername}`,
  })

  if (session.url) {
    redirect(session.url)
  }
}
