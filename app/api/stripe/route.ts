import { ConvexHttpClient } from "convex/browser"
import { NextResponse } from "next/server"
import Stripe from "stripe"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { env } from "@/lib/config/env"
import { clientEnv } from "@/lib/config/env.client"
import { stripe } from "@/lib/services/stripe"
import { convertStripeAmount } from "@/lib/stripe/currency"

export async function POST(request: Request) {
  let event: Stripe.Event

  try {
    const payload = await request.text()
    const sig = request.headers.get("stripe-signature")!

    event = stripe.webhooks.constructEvent(
      payload,
      sig,
      env.STRIPE_WEBHOOK_SECRET,
    )
  } catch (err) {
    console.error(
      "Stripe webhook verification failed:",
      err instanceof Error ? err.message : err,
    )
    return new NextResponse(
      `Webhook error: ${err instanceof Error ? err.message : String(err)}`,
      {
        status: 400,
      },
    )
  }

  try {
    const convex = new ConvexHttpClient(clientEnv.NEXT_PUBLIC_CONVEX_URL)

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        const metadata = session.metadata || {}

        const creatorId = metadata.creatorId
        const subscriberId = metadata.subscriberId

        const startedAt = session.created
          ? new Date(session.created * 1000).toISOString()
          : new Date().toISOString()

        if (!creatorId || !subscriberId || !session.id) break

        const currency = session.currency?.toUpperCase() || "USD"
        const amount = convertStripeAmount(session.amount_total, currency)

        await convex.action(api.internalActions.processPayment, {
          provider: "stripe",
          providerTransactionId: session.id,
          creatorId: creatorId as Id<"users">,
          subscriberId: subscriberId as Id<"users">,
          amount,
          currency,
          paymentMethod: session.payment_method_types?.[0],
          startedAt,
        })
        break
      }
      default:
        console.log(`Unhandled Stripe event: ${event.type}`)
    }
  } catch (err) {
    console.error("Stripe webhook handler error:", err)
    return new NextResponse("Handler error", { status: 500 })
  }

  return new NextResponse("ok", { status: 200 })
}

export async function GET() {
  return NextResponse.json({ ok: true })
}
