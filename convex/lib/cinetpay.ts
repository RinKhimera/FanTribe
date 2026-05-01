/**
 * CinetPay v1 API client + helpers.
 * Pure runtime helpers — usable from default Convex runtime (no node:* imports).
 *
 * Auth flow: POST /v1/oauth/login with { api_key, api_password } → access_token (JWT, 24h TTL).
 * Token is then sent as `Authorization: Bearer ${token}` on /v1/payment and /v1/payment/{token}.
 */

const HTTP_TIMEOUT_MS = 15_000

// ============================================================================
// Types
// ============================================================================

export interface CinetPayLoginResponse {
  code: number
  status: string
  access_token: string
  token_type: string
  expires_in: number
}

export interface CinetPayInitArgs {
  accessToken: string
  baseUrl: string
  merchantTransactionId: string
  amount: number
  currency: "XAF" | "XOF" | "GNF" | "CDF"
  designation: string
  clientEmail: string
  clientFirstName: string
  clientLastName: string
  successUrl: string
  failedUrl: string
  notifyUrl: string
}

export interface CinetPayInitResponse {
  code: number
  status: string
  payment_token: string
  notify_token: string
  transaction_id: string
  merchant_transaction_id: string
  payment_url: string
  details?: {
    code: number
    status: "SUCCESS" | "FAILED" | "INITIATED" | "PENDING"
    message: string
    must_be_redirected: boolean
  }
}

export interface CinetPayStatusResponse {
  code: number
  status: "SUCCESS" | "FAILED" | "PENDING" | "INITIATED" | "REFUSED"
  merchant_transaction_id: string
  transaction_id: string
  user?: {
    name: string
    email: string
    phone_number: string
  }
}

// ============================================================================
// ID generation (Web Crypto, runtime-agnostic)
// ============================================================================

/**
 * Generates a short merchant transaction ID under CinetPay's 30 char limit.
 * Format: "ft_" + 16 base64url chars = 19 chars total.
 */
export const generateMerchantTransactionId = (): string => {
  const bytes = new Uint8Array(12)
  crypto.getRandomValues(bytes)
  let binary = ""
  for (const byte of bytes) binary += String.fromCharCode(byte)
  const base64url = btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "")
  return `ft_${base64url}`
}

// ============================================================================
// Constant-time string comparison (Web Crypto compatible)
// ============================================================================

/**
 * Constant-time equality check on the notify_token to mitigate timing attacks.
 * Returns false on length mismatch without short-circuit on content.
 */
export const verifyNotifyToken = (received: string, stored: string): boolean => {
  if (typeof received !== "string" || typeof stored !== "string") return false
  if (received.length !== stored.length) return false
  let diff = 0
  for (let i = 0; i < received.length; i++) {
    diff |= received.charCodeAt(i) ^ stored.charCodeAt(i)
  }
  return diff === 0
}

// ============================================================================
// HTTP calls (no caching here — caching lives in convex/cinetpay.ts)
// ============================================================================

export const loginAndGetAccessToken = async (
  baseUrl: string,
  apiKey: string,
  apiPassword: string,
): Promise<CinetPayLoginResponse> => {
  const res = await fetch(`${baseUrl}/v1/oauth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ api_key: apiKey, api_password: apiPassword }),
    signal: AbortSignal.timeout(HTTP_TIMEOUT_MS),
  })
  const json = (await res.json()) as CinetPayLoginResponse & {
    message?: string
  }
  if (!res.ok || json.code !== 200 || !json.access_token) {
    throw new Error(
      `CinetPay login failed (${res.status}): ${json.message ?? json.status ?? "unknown"}`,
    )
  }
  return json
}

export const initPayment = async (
  args: CinetPayInitArgs,
): Promise<CinetPayInitResponse> => {
  const res = await fetch(`${args.baseUrl}/v1/payment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${args.accessToken}`,
    },
    body: JSON.stringify({
      currency: args.currency,
      merchant_transaction_id: args.merchantTransactionId,
      amount: args.amount,
      lang: "fr",
      designation: args.designation,
      client_email: args.clientEmail,
      client_first_name: args.clientFirstName,
      client_last_name: args.clientLastName,
      success_url: args.successUrl,
      failed_url: args.failedUrl,
      notify_url: args.notifyUrl,
      direct_pay: false,
    }),
    signal: AbortSignal.timeout(HTTP_TIMEOUT_MS),
  })
  const json = (await res.json()) as CinetPayInitResponse & {
    message?: string
  }
  if (!res.ok || json.code !== 200 || !json.payment_url) {
    throw new Error(
      `CinetPay init failed (${res.status}): ${json.message ?? json.status ?? "unknown"}`,
    )
  }
  return json
}

export const getPaymentStatus = async (
  baseUrl: string,
  accessToken: string,
  paymentToken: string,
): Promise<CinetPayStatusResponse> => {
  const res = await fetch(`${baseUrl}/v1/payment/${paymentToken}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(HTTP_TIMEOUT_MS),
  })
  const json = (await res.json()) as CinetPayStatusResponse & {
    message?: string
  }
  if (!res.ok) {
    throw new Error(
      `CinetPay status fetch failed (${res.status}): ${json.message ?? "unknown"}`,
    )
  }
  return json
}
