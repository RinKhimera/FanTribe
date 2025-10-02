import { ConvexHttpClient } from "convex/browser"
import { NextResponse } from "next/server"
import Stripe from "stripe"
import { api } from "@/convex/_generated/api"
import { env } from "@/lib/config/env"
import { clientEnv } from "@/lib/config/env.client"
import { stripe } from "@/lib/services/stripe"

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
  } catch (err: any) {
    console.error("Stripe webhook verification failed:", err?.message || err)
    return new NextResponse(`Webhook error: ${err?.message || String(err)}`, {
      status: 400,
    })
  }

  try {
    const convex = new ConvexHttpClient(clientEnv.NEXT_PUBLIC_CONVEX_URL)

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        const metadata = session.metadata || {}

        const creatorId = metadata.creatorId as any
        const subscriberId = metadata.subscriberId as any

        const startedAt = session.created
          ? new Date(session.created * 1000).toISOString()
          : new Date().toISOString()

        if (!creatorId || !subscriberId || !session.id) break

        // Stripe renvoie les montants en centimes pour les devises à 2 décimales
        // mais les devises à zéro décimale (comme XAF) sont déjà en unités entières
        const currency = session.currency?.toUpperCase() || "USD"

        // Liste des devises à zéro décimale selon Stripe
        // https://docs.stripe.com/currencies#zero-decimal
        const zeroDecimalCurrencies = [
          "BIF",
          "CLP",
          "DJF",
          "GNF",
          "JPY",
          "KMF",
          "KRW",
          "MGA",
          "PYG",
          "RWF",
          "UGX",
          "VND",
          "VUV",
          "XAF",
          "XOF",
          "XPF",
        ]

        const isZeroDecimal = zeroDecimalCurrencies.includes(currency)
        const amount = session.amount_total
          ? isZeroDecimal
            ? session.amount_total // XAF: 1000 = 1000 XAF
            : session.amount_total / 100 // USD: 500 = 5.00 USD
          : 0

        await convex.action(api.internalActions.processPayment, {
          provider: "stripe",
          providerTransactionId: session.id,
          creatorId,
          subscriberId,
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
