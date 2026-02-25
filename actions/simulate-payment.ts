"use server"

import { fetchAction } from "convex/nextjs"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import {
  isPaymentTestForceFail,
  isPaymentTestMode,
} from "@/lib/config/payment-test"

export async function simulateSubscriptionPayment(params: {
  creatorId: string
  subscriberId: string
  creatorUsername: string
  amount?: number
  currency?: string
  action?: "subscribe" | "renew"
}) {
  if (!isPaymentTestMode()) {
    return { success: false, error: "Test mode is not enabled" }
  }

  if (isPaymentTestForceFail()) {
    return {
      success: false,
      redirectUrl: `/payment/result?status=failed&username=${params.creatorUsername}&reason=test_force_fail`,
    }
  }

  const providerTransactionId = `test_sub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

  const result = await fetchAction(api.internalActions.processPayment, {
    provider: "test",
    providerTransactionId,
    creatorId: params.creatorId as Id<"users">,
    subscriberId: params.subscriberId as Id<"users">,
    amount: params.amount ?? 1000,
    currency: params.currency ?? "XAF",
    paymentMethod: "test_simulation",
    startedAt: new Date().toISOString(),
  })

  return {
    success: result.success,
    redirectUrl: `/payment/result?status=success&username=${params.creatorUsername}`,
  }
}

export async function simulateTipPayment(params: {
  senderId: string
  creatorId: string
  creatorUsername: string
  amount: number
  currency?: string
  tipMessage?: string
  context?: "post" | "profile" | "message"
  postId?: string
  conversationId?: string
}) {
  if (!isPaymentTestMode()) {
    return { success: false, error: "Test mode is not enabled" }
  }

  if (isPaymentTestForceFail()) {
    return {
      success: false,
      redirectUrl: `/payment/result?status=failed&username=${params.creatorUsername}&reason=test_force_fail`,
    }
  }

  const providerTransactionId = `test_tip_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

  const result = await fetchAction(api.internalActions.processTip, {
    provider: "test",
    providerTransactionId,
    senderId: params.senderId as Id<"users">,
    creatorId: params.creatorId as Id<"users">,
    amount: params.amount,
    currency: params.currency ?? "XAF",
    message: params.tipMessage || undefined,
    context: params.context || undefined,
    postId: params.postId
      ? (params.postId as Id<"posts">)
      : undefined,
    conversationId: params.conversationId
      ? (params.conversationId as Id<"conversations">)
      : undefined,
  })

  return {
    success: result.success,
    redirectUrl: `/payment/result?status=success&type=tip&username=${params.creatorUsername}`,
  }
}
