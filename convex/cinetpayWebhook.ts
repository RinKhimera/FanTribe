"use node"

import crypto from "crypto"
import { v } from "convex/values"
import { internal } from "./_generated/api"
import type { Id } from "./_generated/dataModel"
import { internalAction } from "./_generated/server"

// ============================================================================
// Types
// ============================================================================

type CinetPayResponse = {
  code: string
  message: string
  data: {
    amount: string
    currency: string
    status: string
    payment_method: string
    description: string
    metadata: unknown
    operator_id: string | null
    payment_date: string
    fund_availability_date: string
  }
  api_response_id: string
}

type CinetPayMetadata = {
  creatorId: string
  subscriberId: string
  type?: string
  action?: string
  senderId?: string
  tipMessage?: string
  tipContext?: "post" | "profile" | "message"
  postId?: string
  conversationId?: string
}

// ============================================================================
// HMAC Signature Verification
// ============================================================================

const HMAC_FIELDS = [
  "cpm_site_id",
  "cpm_trans_id",
  "cpm_trans_date",
  "cpm_amount",
  "cpm_currency",
  "signature",
  "payment_method",
  "cel_phone_num",
  "cpm_phone_prefixe",
  "cpm_language",
  "cpm_version",
  "cpm_payment_config",
  "cpm_page_action",
  "cpm_custom",
  "cpm_designation",
  "cpm_error_message",
]

function verifyCinetPayHmac(
  body: Record<string, string>,
  xToken: string | null,
  secretKey: string,
): boolean {
  if (!xToken) return false

  const data = HMAC_FIELDS.map((f) => body[f] || "").join("")
  const expectedToken = crypto
    .createHmac("sha256", secretKey)
    .update(data)
    .digest("hex")

  try {
    return crypto.timingSafeEqual(
      Buffer.from(xToken),
      Buffer.from(expectedToken),
    )
  } catch {
    return false
  }
}

// ============================================================================
// Metadata Validation
// ============================================================================

function parseMetadata(raw: string): CinetPayMetadata | null {
  try {
    const parsed = JSON.parse(raw)
    if (
      !parsed ||
      typeof parsed.creatorId !== "string" ||
      !parsed.creatorId ||
      typeof parsed.subscriberId !== "string" ||
      !parsed.subscriberId
    ) {
      return null
    }
    return {
      creatorId: parsed.creatorId,
      subscriberId: parsed.subscriberId,
      type: parsed.type,
      action: parsed.action,
      senderId: parsed.senderId,
      tipMessage: parsed.tipMessage,
      tipContext:
        parsed.tipContext === "post" ||
        parsed.tipContext === "profile" ||
        parsed.tipContext === "message"
          ? parsed.tipContext
          : undefined,
      postId: parsed.postId,
      conversationId: parsed.conversationId,
    }
  } catch {
    return null
  }
}

// ============================================================================
// CinetPay API Verification
// ============================================================================

async function verifyCinetPayPayment(
  apiKey: string,
  siteId: string,
  transactionId: string,
): Promise<CinetPayResponse | null> {
  const res = await fetch(
    "https://api-checkout.cinetpay.com/v2/payment/check",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apikey: apiKey,
        site_id: siteId,
        transaction_id: transactionId,
      }),
    },
  )

  if (!res.ok) return null
  return (await res.json()) as CinetPayResponse
}

// ============================================================================
// Webhook Handler (POST /cinetpay)
// ============================================================================

export const verifyAndProcessWebhook = internalAction({
  args: {
    body: v.string(),
    xToken: v.union(v.string(), v.null()),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    status: v.number(),
  }),
  handler: async (ctx, args) => {
    const secretKey = process.env.CINETPAY_SECRET_KEY
    const apiKey = process.env.CINETPAY_API_KEY
    const siteId = process.env.CINETPAY_SITE_ID

    if (!secretKey || !apiKey || !siteId) {
      console.error("CinetPay env vars not configured")
      return { success: false, message: "Server configuration error", status: 500 }
    }

    // 1. Parse URL-encoded body
    const params = new URLSearchParams(args.body)
    const body = Object.fromEntries(params.entries())

    const transactionId = body.cpm_trans_id
    if (!transactionId || !body.cpm_site_id) {
      return {
        success: false,
        message: "Missing cpm_trans_id or cpm_site_id",
        status: 400,
      }
    }

    // 2. Verify HMAC signature
    if (!verifyCinetPayHmac(body, args.xToken, secretKey)) {
      console.error("CinetPay HMAC verification failed")
      return { success: false, message: "Invalid HMAC signature", status: 401 }
    }

    // 3. Parse metadata
    if (!body.cpm_custom) {
      return { success: false, message: "Missing cpm_custom metadata", status: 400 }
    }

    const metadata = parseMetadata(body.cpm_custom)
    if (!metadata) {
      return { success: false, message: "Invalid cpm_custom format", status: 400 }
    }

    const creatorId = metadata.creatorId as Id<"users">
    const subscriberId = metadata.subscriberId as Id<"users">

    // 4. Verify payment with CinetPay API
    const checkData = await verifyCinetPayPayment(apiKey, siteId, transactionId)
    if (!checkData) {
      return { success: false, message: "CinetPay API error", status: 502 }
    }

    if (checkData.code !== "00") {
      return {
        success: false,
        message: `Payment verification failed: ${checkData.code} - ${checkData.message}`,
        status: 400,
      }
    }

    const cinetPayAmount = checkData.data.amount
      ? Number(checkData.data.amount)
      : 0

    // 5. Route to tip or subscription processing
    if (metadata.type === "tip") {
      await ctx.runMutation(internal.tips.processTipAtomic, {
        provider: "cinetpay",
        providerTransactionId: transactionId,
        senderId: (metadata.senderId || subscriberId) as Id<"users">,
        creatorId,
        amount: cinetPayAmount,
        currency: checkData.data.currency || "XOF",
        message: metadata.tipMessage || undefined,
        context: metadata.tipContext || undefined,
        postId: metadata.postId
          ? (metadata.postId as Id<"posts">)
          : undefined,
        conversationId: metadata.conversationId
          ? (metadata.conversationId as Id<"conversations">)
          : undefined,
      })
    } else {
      await ctx.runMutation(internal.internalActions.processPaymentAtomic, {
        provider: "cinetpay",
        providerTransactionId: transactionId,
        creatorId,
        subscriberId,
        amount: cinetPayAmount,
        currency: checkData.data.currency || "XOF",
        paymentMethod: checkData.data.payment_method || undefined,
        startedAt: new Date().toISOString(),
      })
    }

    return { success: true, message: "Webhook processed", status: 200 }
  },
})

// ============================================================================
// Return URL Handler (POST /cinetpay-return)
// ============================================================================

export const verifyAndProcessReturn = internalAction({
  args: {
    body: v.string(),
  },
  returns: v.object({
    redirect: v.string(),
  }),
  handler: async (ctx, args) => {
    const apiKey = process.env.CINETPAY_API_KEY
    const siteId = process.env.CINETPAY_SITE_ID

    if (!apiKey || !siteId) {
      return { redirect: "/payment/result?status=failed&reason=configuration_error" }
    }

    // 1. Extract transaction_id from form body
    const params = new URLSearchParams(args.body)
    const transactionId = params.get("transaction_id")

    if (!transactionId) {
      return { redirect: "/payment/result?status=failed&reason=missing_transaction" }
    }

    // 2. Check if already processed
    const existingTx = await ctx.runQuery(
      internal.internalActions.getTransactionByProviderTransactionId,
      { providerTransactionId: transactionId },
    )

    if (existingTx) {
      return {
        redirect: `/payment/result?status=success&transaction=${transactionId}&provider=cinetpay`,
      }
    }

    // 3. Verify with CinetPay API
    const checkData = await verifyCinetPayPayment(apiKey, siteId, transactionId)

    if (!checkData) {
      return { redirect: "/payment/result?status=failed&reason=payment_check_failed" }
    }

    if (checkData.code === "00") {
      // Payment successful — process idempotently
      const metadata = (
        checkData as { data?: { metadata?: Record<string, string> } }
      )?.data?.metadata

      try {
        await ctx.runMutation(internal.internalActions.processPaymentAtomic, {
          provider: "cinetpay",
          providerTransactionId: transactionId,
          creatorId: (metadata?.creatorId || "") as Id<"users">,
          subscriberId: (metadata?.subscriberId || "") as Id<"users">,
          amount: checkData.data.amount ? Number(checkData.data.amount) : 0,
          currency: checkData.data.currency || "XOF",
          paymentMethod: checkData.data.payment_method || undefined,
          startedAt: checkData.data.payment_date || new Date().toISOString(),
        })
      } catch (e) {
        console.warn("Return handler: processPayment optional call failed", e)
      }

      const metaType = metadata?.type === "tip" ? "&type=tip" : ""
      return {
        redirect: `/payment/result?status=success&transaction=${transactionId}&provider=cinetpay${metaType}`,
      }
    }

    return {
      redirect: `/payment/result?status=failed&reason=payment_failed&code=${checkData.code}&provider=cinetpay`,
    }
  },
})
