import crypto from "crypto"
import { fetchAction } from "convex/nextjs"
import { z } from "zod"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { CinetPayResponse } from "@/types"

const CinetPayMetadataSchema = z.object({
  creatorId: z.string().min(1, "creatorId is required"),
  subscriberId: z.string().min(1, "subscriberId is required"),
  type: z.string().optional(),
  action: z.string().optional(),
  senderId: z.string().optional(),
  tipMessage: z.string().optional(),
  tipContext: z.enum(["post", "profile", "message"]).optional(),
  postId: z.string().optional(),
  conversationId: z.string().optional(),
})

/**
 * Verifie la signature HMAC du webhook CinetPay
 * @see https://docs.cinetpay.com/api/1.0-fr/checkout/hmac
 */
function verifyCinetPayHmac(
  body: Record<string, string>,
  xToken: string | null,
): boolean {
  const secretKey = process.env.CINETPAY_SECRET_KEY
  if (!secretKey || !xToken) return false

  const fields = [
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

  const data = fields.map((f) => body[f] || "").join("")
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

export async function POST(request: Request) {
  try {
    const textBody = await request.text()
    const params = new URLSearchParams(textBody)
    const body = Object.fromEntries(params.entries())

    const transactionId = body.cpm_trans_id
    const siteId = body.cpm_site_id

    if (!transactionId || !siteId) {
      return Response.json(
        { error: "Missing cpm_trans_id or cpm_site_id" },
        { status: 400 },
      )
    }

    // Verify HMAC signature
    const xToken = request.headers.get("x-token")
    if (!verifyCinetPayHmac(body, xToken)) {
      console.error("CinetPay HMAC verification failed")
      return Response.json(
        { error: "Invalid HMAC signature" },
        { status: 401 },
      )
    }

    // Parse metadata from cpm_custom
    if (!body.cpm_custom) {
      return Response.json(
        { error: "Missing cpm_custom metadata" },
        { status: 400 },
      )
    }

    let metadata: z.infer<typeof CinetPayMetadataSchema>
    try {
      const rawMetadata = JSON.parse(body.cpm_custom)
      metadata = CinetPayMetadataSchema.parse(rawMetadata)
    } catch (e) {
      console.error("Error parsing cpm_custom:", e)
      return Response.json(
        { error: "Invalid cpm_custom format" },
        { status: 400 },
      )
    }

    const creatorId = metadata.creatorId as Id<"users">
    const subscriberId = metadata.subscriberId as Id<"users">

    // Verify payment with CinetPay API
    const apiKey = process.env.NEXT_PUBLIC_CINETPAY_API_KEY
    if (!apiKey) {
      return Response.json(
        { error: "CinetPay API key not configured" },
        { status: 500 },
      )
    }

    const checkRes = await fetch(
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

    if (!checkRes.ok) {
      return Response.json(
        { error: "CinetPay API error", status: checkRes.status },
        { status: 502 },
      )
    }

    const checkData: CinetPayResponse = await checkRes.json()

    if (checkData.code !== "00") {
      return Response.json({
        message: "Payment verification failed",
        code: checkData.code,
        description: checkData.message || "Unknown status",
      })
    }

    const cinetPayAmount = checkData.data.amount
      ? Number(checkData.data.amount)
      : 0

    // Route to tip or subscription processing
    if (metadata.type === "tip") {
      const tipResult = await fetchAction(api.internalActions.processTip, {
        provider: "cinetpay",
        providerTransactionId: transactionId,
        senderId: (metadata.senderId || subscriberId) as Id<"users">,
        creatorId,
        amount: cinetPayAmount,
        currency: checkData.data.currency || "XOF",
        message: metadata.tipMessage || undefined,
        context:
          (metadata.tipContext as "post" | "profile" | "message") || undefined,
        postId: metadata.postId
          ? (metadata.postId as Id<"posts">)
          : undefined,
        conversationId: metadata.conversationId
          ? (metadata.conversationId as Id<"conversations">)
          : undefined,
      })

      return Response.json({
        message: tipResult.alreadyProcessed
          ? "Tip already processed"
          : "Tip processed successfully",
        result: tipResult,
      })
    }

    const result = await fetchAction(api.internalActions.processPayment, {
      provider: "cinetpay",
      providerTransactionId: transactionId,
      creatorId,
      subscriberId,
      amount: cinetPayAmount,
      currency: checkData.data.currency || "XOF",
      paymentMethod: checkData.data.payment_method || undefined,
      startedAt: new Date().toISOString(),
    })

    return Response.json({
      message: result.alreadyProcessed
        ? "Transaction already processed"
        : "Transaction processed successfully",
      result,
      paymentDetails: {
        amount: checkData.data.amount,
        currency: checkData.data.currency,
        paymentDate: checkData.data.payment_date,
        status: checkData.code,
      },
    })
  } catch (error) {
    console.error("Webhook error:", error)
    return Response.json(
      {
        error: "Webhook error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return Response.json(
    { message: "API Notify URL is healthy and running" },
    { status: 200 },
  )
}
