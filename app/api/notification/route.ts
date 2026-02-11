import crypto from "crypto"
import { fetchAction } from "convex/nextjs"
import { z } from "zod"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { CinetPayResponse } from "@/types"

// Schema de validation pour les metadata CinetPay
const CinetPayMetadataSchema = z.object({
  creatorId: z.string().min(1, "creatorId is required"),
  subscriberId: z.string().min(1, "subscriberId is required"),
  type: z.string().optional(),
  action: z.string().optional(),
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

  // Champs a concatener dans l'ordre exact selon la doc CinetPay
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
    // Si les buffers ont des tailles differentes, timingSafeEqual throw
    return false
  }
}

export async function POST(request: Request) {
  try {
    // Récupérer les données de la requête
    let body
    const contentType = request.headers.get("content-type") || ""

    // Supporter les deux formats : form-data et JSON pour les tests Postman
    if (contentType.includes("application/json")) {
      body = await request.json()
    } else {
      // Format form-urlencoded
      const textBody = await request.text()
      const params = new URLSearchParams(textBody)
      body = Object.fromEntries(params.entries())
    }

    // Extraire les paramètres clés
    const transactionId =
      body.cpm_trans_id || body.transaction_id || `test-${Date.now()}`
    const siteId =
      body.cpm_site_id ||
      body.site_id ||
      process.env.NEXT_PUBLIC_CINETPAY_SITE_ID!

    // MODE TEST: Ignorer la vérification HMAC et CinetPay
    // En production, la verification est activee
    // Pour tester en local, utiliser ngrok pour exposer le serveur
    const testMode = process.env.NODE_ENV !== "production"

    // Verification HMAC en production
    if (!testMode) {
      const xToken = request.headers.get("x-token")
      if (!verifyCinetPayHmac(body, xToken)) {
        console.error("CinetPay HMAC verification failed")
        return Response.json(
          { error: "Invalid HMAC signature" },
          { status: 401 },
        )
      }
    }

    // Extraire et valider les métadonnées avec Zod
    let creatorId: Id<"users">
    let subscriberId: Id<"users">
    let amountPaid: number | undefined

    if (body.cpm_custom) {
      // Production: metadata depuis cpm_custom
      try {
        const rawMetadata = JSON.parse(body.cpm_custom)
        const parseResult = CinetPayMetadataSchema.safeParse(rawMetadata)

        if (!parseResult.success) {
          console.error("Invalid metadata format:", parseResult.error.flatten())
          return Response.json(
            {
              error: "Invalid metadata format",
              details: parseResult.error.flatten(),
            },
            { status: 400 },
          )
        }

        creatorId = parseResult.data.creatorId as Id<"users">
        subscriberId = parseResult.data.subscriberId as Id<"users">
      } catch (e) {
        console.error("Error parsing cpm_custom JSON:", e)
        return Response.json(
          { error: "Invalid cpm_custom JSON format" },
          { status: 400 },
        )
      }
    } else if (testMode) {
      // Test mode: permettre les IDs directement dans le body
      const parseResult = CinetPayMetadataSchema.safeParse({
        creatorId: body.creatorId,
        subscriberId: body.subscriberId,
      })

      if (!parseResult.success) {
        return Response.json(
          {
            error: "Missing required parameters: creatorId and subscriberId",
            details: parseResult.error.flatten(),
          },
          { status: 400 },
        )
      }

      creatorId = parseResult.data.creatorId as Id<"users">
      subscriberId = parseResult.data.subscriberId as Id<"users">
      amountPaid = body.amountPaid ? Number(body.amountPaid) : 1000
    } else {
      // Production sans cpm_custom = erreur
      return Response.json(
        { error: "Missing cpm_custom metadata" },
        { status: 400 },
      )
    }

    if (testMode) {
      // Simuler une réponse CinetPay réussie
      const mockResponse: CinetPayResponse = {
        code: "00",
        message: "PAYMENT SUCCESSFUL (TEST MODE)",
        data: {
          amount: String(amountPaid || 1000),
          currency: "XOF",
          status: "ACCEPTED",
          payment_method: "TEST",
          description: "Abonnement test",
          metadata: {
            creatorId: creatorId,
            subscriberId: subscriberId,
          },
          operator_id: null,
          payment_date: new Date().toISOString(),
          fund_availability_date: new Date().toISOString(),
        },
        api_response_id: `api-${Date.now()}`,
      }

      // Traiter le paiement simulé avec la nouvelle signature
      const result = await fetchAction(api.internalActions.processPayment, {
        provider: "cinetpay",
        providerTransactionId: transactionId,
        creatorId,
        subscriberId,
        amount: amountPaid || 1000,
        currency: mockResponse.data.currency,
        paymentMethod: mockResponse.data.payment_method || "TEST",
        startedAt: new Date().toISOString(),
      })

      return Response.json({
        message: result.alreadyProcessed
          ? "Transaction already processed (TEST MODE)"
          : "Transaction processed successfully (TEST MODE)",
        result,
        paymentDetails: {
          amount: mockResponse.data.amount,
          currency: mockResponse.data.currency,
          paymentDate: mockResponse.data.payment_date,
          status: mockResponse.code,
        },
      })
    }

    // Si on n'est pas en mode test, continuer avec le processus normal
    // Code CinetPay original (pour la production)
    const apiKey = process.env.NEXT_PUBLIC_CINETPAY_API_KEY!
    if (!apiKey) {
      return Response.json(
        { error: "CinetPay API key not configured" },
        { status: 500 },
      )
    }

    const payload = {
      apikey: apiKey,
      site_id: siteId,
      transaction_id: transactionId,
    }

    // Appel à l'API CinetPay pour vérifier le statut du paiement
    const checkRes = await fetch(
      "https://api-checkout.cinetpay.com/v2/payment/check",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    )

    if (!checkRes.ok) {
      return Response.json(
        { error: "CinetPay API error", status: checkRes.status },
        { status: 502 },
      )
    }

    const checkData: CinetPayResponse = await checkRes.json()

    // Vérification que le paiement est réussi
    if (checkData.code === "00") {
      // Extraire le montant du paiement
      const cinetPayAmount = checkData.data.amount
        ? Number(checkData.data.amount)
        : undefined

      // Utilise l'action pour traiter le paiement avec la nouvelle signature
      const result = await fetchAction(api.internalActions.processPayment, {
        provider: "cinetpay",
        providerTransactionId: transactionId,
        creatorId,
        subscriberId,
        amount: cinetPayAmount || 0,
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
    }

    // Paiement refusé ou autre statut
    return Response.json({
      message: "Payment verification failed",
      code: checkData.code,
      description: checkData.message || "Unknown status",
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
