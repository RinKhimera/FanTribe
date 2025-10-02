import { v4 as uuidv4 } from "uuid"

export type PaymentData = {
  creatorId: string
  subscriberId: string
  creatorUsername?: string
  amount?: number
  description?: string
  customFields?: Record<string, string>
}

export type PaymentResponse = {
  success: boolean
  payment_url?: string
  transaction_id?: string
  message?: string
  error?: string
}

export const initializeCinetPayPayment = async (
  paymentData: PaymentData,
): Promise<PaymentResponse> => {
  try {
    const transactionId = uuidv4()

    const metadataObj = {
      creatorId: paymentData.creatorId,
      subscriberId: paymentData.subscriberId,
      ...paymentData.customFields,
    }
    const metadataString = JSON.stringify(metadataObj)

    const requestBody = {
      apikey: process.env.NEXT_PUBLIC_CINETPAY_API_KEY,
      site_id: process.env.NEXT_PUBLIC_CINETPAY_SITE_ID,
      transaction_id: transactionId,
      amount: paymentData.amount || 1000,
      currency: "XAF",
      description: paymentData.description || "Abonnement mensuel",
      notify_url: "https://fantribe.io/api/notification",
      return_url: "https://fantribe.io/api/return",
      channels: "ALL",
      metadata: metadataString,
      lang: "FR",
      invoice_data: {
        Donnee1: "",
        Donnee2: "",
        Donnee3: "",
      },
      // customer_id: "172",
      // customer_name: "KOUADIO",
      // customer_surname: "Francisse",
      // customer_email: "harrissylver@gmail.com",
      // customer_phone_number: "+225004315545",
      // customer_address: "Antananarivo",
      // customer_city: "Antananarivo",
      // customer_country: "CM",
      // customer_state: "CM",
      // customer_zip_code: "065100",
      // alternative_currency: "",
    }

    const response = await fetch(
      "https://api-checkout.cinetpay.com/v2/payment",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      },
    )

    const data = await response.json()

    if (response.ok && data.code === "201") {
      return {
        success: true,
        payment_url: data.data.payment_url,
        transaction_id: transactionId,
        message: data.message,
      }
    } else {
      return {
        success: false,
        error: data.message || "Erreur lors de l'initialisation du paiement",
      }
    }
  } catch (error) {
    console.error("Payment initialization error:", error)
    return {
      success: false,
      error: "Erreur de connexion. Veuillez réessayer.",
    }
  }
}
