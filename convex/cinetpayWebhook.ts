import { v } from "convex/values"
import { internal } from "./_generated/api"
import { internalAction } from "./_generated/server"
import type { ActionCtx } from "./_generated/server"
import {
  getPaymentStatus,
  loginAndGetAccessToken,
  verifyNotifyToken,
} from "./lib/cinetpay"
import { createAppError } from "./lib/errors"

const ensureAccessToken = async (ctx: ActionCtx): Promise<string> => {
  const cached = await ctx.runQuery(internal.cinetpay.getCachedAccessToken, {})
  if (cached) return cached

  const baseUrl = process.env.CINETPAY_BASE_URL
  const apiKey = process.env.CINETPAY_API_KEY
  const apiPassword = process.env.CINETPAY_SECRET_KEY
  if (!baseUrl || !apiKey || !apiPassword) {
    throw createAppError("EXTERNAL_SERVICE_ERROR", {
      message: "CinetPay env vars missing",
    })
  }
  const login = await loginAndGetAccessToken(baseUrl, apiKey, apiPassword)
  const expiresAt = Date.now() + login.expires_in * 1000
  await ctx.runMutation(internal.cinetpay.cacheAccessToken, {
    accessToken: login.access_token,
    expiresAt,
  })
  return login.access_token
}

export const handleNotification = internalAction({
  args: {
    body: v.any(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, { body }) => {
    const merchantTransactionId =
      typeof body?.merchant_transaction_id === "string"
        ? body.merchant_transaction_id
        : null
    const receivedNotifyToken =
      typeof body?.notify_token === "string" ? body.notify_token : null

    if (!merchantTransactionId || !receivedNotifyToken) {
      console.error("[cinetpay] webhook missing fields", { body })
      return { success: false, message: "Missing required fields" }
    }

    const payment = await ctx.runQuery(
      internal.cinetpay.getByMerchantTransactionId,
      { merchantTransactionId },
    )
    if (!payment) {
      console.error("[cinetpay] webhook: unknown merchant_transaction_id", {
        merchantTransactionId,
      })
      return { success: false, message: "Unknown transaction" }
    }

    if (payment.status !== "pending") {
      return { success: true, message: "Already processed" }
    }

    if (!verifyNotifyToken(receivedNotifyToken, payment.notifyToken)) {
      console.error("[cinetpay] webhook notify_token mismatch", {
        merchantTransactionId,
      })
      return { success: false, message: "Invalid notify_token" }
    }

    const baseUrl = process.env.CINETPAY_BASE_URL
    if (!baseUrl) {
      throw createAppError("EXTERNAL_SERVICE_ERROR", {
        message: "Missing CINETPAY_BASE_URL",
      })
    }

    let accessToken = await ensureAccessToken(ctx)
    let status
    try {
      status = await getPaymentStatus(baseUrl, accessToken, payment.paymentToken)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      if (message.includes("401")) {
        const login = await loginAndGetAccessToken(
          baseUrl,
          process.env.CINETPAY_API_KEY ?? "",
          process.env.CINETPAY_SECRET_KEY ?? "",
        )
        accessToken = login.access_token
        await ctx.runMutation(internal.cinetpay.cacheAccessToken, {
          accessToken: login.access_token,
          expiresAt: Date.now() + login.expires_in * 1000,
        })
        status = await getPaymentStatus(
          baseUrl,
          accessToken,
          payment.paymentToken,
        )
      } else {
        throw err
      }
    }

    if (status.status === "SUCCESS" && status.code === 100) {
      await ctx.runMutation(internal.internalActions.processPaymentAtomic, {
        provider: "cinetpay",
        providerTransactionId: status.transaction_id,
        creatorId: payment.creatorId,
        subscriberId: payment.subscriberId,
        amount: payment.amount,
        currency: "XAF",
        paymentMethod: "mobile_money",
      })
      await ctx.runMutation(internal.cinetpay.markSucceeded, {
        paymentId: payment._id,
        cinetpayTransactionId: status.transaction_id,
      })
      return { success: true, message: "Payment processed" }
    }

    if (status.status === "FAILED" || status.status === "REFUSED") {
      await ctx.runMutation(internal.cinetpay.markFailed, {
        paymentId: payment._id,
      })
      return { success: true, message: "Payment marked failed" }
    }

    return { success: true, message: `Payment still ${status.status}` }
  },
})
