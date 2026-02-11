import { fetchAction } from "convex/nextjs"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { CinetPayResponse } from "@/types"

export async function POST(request: Request) {
  try {
    const body = await request.text()
    const params = new URLSearchParams(body)
    const transactionId = params.get("transaction_id")

    // Vérification des paramètres requis
    if (!transactionId) {
      console.error("Return API: Missing transaction ID")
      return Response.redirect(
        new URL("/payment/cancelled?reason=missing_transaction", request.url),
      )
    }

    // Vérifier d'abord si la transaction existe déjà dans notre base de données
    const transactionStatus = await fetchAction(
      api.internalActions.checkTransaction,
      {
        transactionId,
      },
    )

    // Si la transaction existe déjà, rediriger directement vers la page de succès
    if (transactionStatus.exists) {
      return Response.redirect(
        new URL(`/payment/merci?transaction=${transactionId}`, request.url),
      )
    }

    // Si la transaction n'existe pas dans notre base, vérifier avec CinetPay
    // Prépare le payload pour CinetPay
    const apiKey = process.env.NEXT_PUBLIC_CINETPAY_API_KEY!
    const siteId = process.env.NEXT_PUBLIC_CINETPAY_SITE_ID!

    if (!apiKey || !siteId) {
      console.error("Return API: Missing API key or site ID")
      return Response.redirect(
        new URL("/payment/cancelled?reason=configuration_error", request.url),
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
      console.error(`Return API: CinetPay API error: ${checkRes.status}`)
      return Response.redirect(
        new URL("/payment/cancelled?reason=payment_check_failed", request.url),
      )
    }

    const checkData: CinetPayResponse = await checkRes.json()

    // Vérification que le paiement est réussi
    if (checkData.code === "00") {
      // Optionnel: tenter un traitement idempotent si le webhook n'a pas encore touché
      try {
        const metadata = (
          checkData as { data?: { metadata?: Record<string, string> } }
        )?.data?.metadata
        await fetchAction(api.internalActions.processPayment, {
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
        console.warn("Return API: processPayment optional call failed", e)
      }

      // Rediriger vers la page de succès quoi qu'il arrive (le traitement est idempotent)
      return Response.redirect(
        new URL(`/payment/merci?transaction=${transactionId}`, request.url),
      )
    } else {
      // Paiement refusé ou autre statut
      console.warn(
        `Return API: Payment failed or pending: ${checkData.code} - ${checkData.message}`,
      )
      return Response.redirect(
        new URL(
          `/payment/cancelled?reason=payment_failed&code=${checkData.code}`,
          request.url,
        ),
      )
    }
  } catch (error) {
    // En cas d'erreur inattendue
    console.error("Return API error:", error)
    return Response.redirect(
      new URL("/payment/cancelled?reason=unexpected_error", request.url),
    )
  }
}

export async function GET() {
  return Response.json(
    { message: "API Return URL is healthy and running" },
    { status: 200 },
  )
}
