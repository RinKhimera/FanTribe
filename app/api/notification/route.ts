import { fetchAction } from "convex/nextjs"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { CinetPayResponse } from "@/types"

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

    // Extraire ou utiliser les métadonnées
    let creatorId: Id<"users"> | undefined
    let subscriberId: Id<"users"> | undefined
    let amountPaid: number | undefined

    // Parsing des métadonnées (soit depuis cpm_custom ou directement depuis le body pour les tests)
    if (body.cpm_custom) {
      try {
        const metadataObj = JSON.parse(body.cpm_custom)
        creatorId = metadataObj.creatorId as Id<"users">
        subscriberId = metadataObj.subscriberId as Id<"users">
      } catch (e) {
        console.error("Error parsing metadata:", e)
      }
    } else {
      // Pour les tests Postman, permettre de passer directement les IDs
      creatorId = body.creatorId as Id<"users">
      subscriberId = body.subscriberId as Id<"users">
      amountPaid = body.amountPaid ? Number(body.amountPaid) : 1000
    }

    // Validation des données requises
    if (!creatorId || !subscriberId) {
      return Response.json(
        { error: "Missing required parameters: creatorId and subscriberId" },
        { status: 400 },
      )
    }

    // MODE TEST: Ignorer la vérification CinetPay et simuler une transaction réussie
    // Pour la production, vous remettrez le code de vérification CinetPay
    const testMode =
      process.env.NODE_ENV !== "production" || body.test_mode === "true"

    if (testMode) {
      console.log("🧪 TEST MODE: Bypassing CinetPay verification")

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
