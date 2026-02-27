"use node"

import Stripe from "stripe"
import { v } from "convex/values"
import { internal } from "./_generated/api"
import type { Id } from "./_generated/dataModel"
import { internalAction } from "./_generated/server"

// ============================================================================
// Stripe Amount Conversion (inlined from lib/formatters/currency)
// ============================================================================

const ZERO_DECIMAL_CURRENCIES = [
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

function convertStripeAmount(
  amountTotal: number | null | undefined,
  currency: string | null | undefined,
): number {
  if (amountTotal === null || amountTotal === undefined) return 0
  const normalized = (currency ?? "USD").toUpperCase()
  return ZERO_DECIMAL_CURRENCIES.includes(normalized)
    ? amountTotal
    : amountTotal / 100
}

// ============================================================================
// Stripe Webhook Verification + Processing
// ============================================================================

export const verifyAndProcess = internalAction({
  args: {
    body: v.string(),
    signature: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

    // 1. Verify webhook signature
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(
        args.body,
        args.signature,
        webhookSecret,
      )
    } catch (err) {
      console.error(
        "Stripe webhook verification failed:",
        err instanceof Error ? err.message : err,
      )
      return { success: false, message: "Invalid signature" }
    }

    // 2. Handle event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        const metadata = session.metadata || {}

        const currency = session.currency?.toUpperCase() || "USD"
        const amount = convertStripeAmount(session.amount_total, currency)

        if (metadata.type === "tip") {
          // Tip payment
          const senderId = metadata.senderId
          const creatorId = metadata.creatorId
          if (!senderId || !creatorId || !session.id) break

          await ctx.runMutation(internal.tips.processTipAtomic, {
            provider: "stripe",
            providerTransactionId: session.id,
            senderId: senderId as Id<"users">,
            creatorId: creatorId as Id<"users">,
            amount,
            currency,
            message: metadata.tipMessage || undefined,
            context:
              (metadata.tipContext as "post" | "profile" | "message") ||
              undefined,
            postId: metadata.postId
              ? (metadata.postId as Id<"posts">)
              : undefined,
            conversationId: metadata.conversationId
              ? (metadata.conversationId as Id<"conversations">)
              : undefined,
          })
        } else {
          // Subscription payment
          const creatorId = metadata.creatorId
          const subscriberId = metadata.subscriberId

          const startedAt = session.created
            ? new Date(session.created * 1000).toISOString()
            : new Date().toISOString()

          if (!creatorId || !subscriberId || !session.id) break

          await ctx.runMutation(
            internal.internalActions.processPaymentAtomic,
            {
              provider: "stripe",
              providerTransactionId: session.id,
              creatorId: creatorId as Id<"users">,
              subscriberId: subscriberId as Id<"users">,
              amount,
              currency,
              paymentMethod: session.payment_method_types?.[0],
              startedAt,
            },
          )
        }
        break
      }
      default:
        break
    }

    return { success: true, message: "Webhook processed" }
  },
})
