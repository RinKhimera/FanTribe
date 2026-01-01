// ============================================
// Types
// ============================================

export type Currency = "USD" | "XAF"

export type ZeroDecimalCurrency = (typeof ZERO_DECIMAL_CURRENCIES)[number]

// ============================================
// Constants
// ============================================

/**
 * Liste des devises à zéro décimale selon Stripe
 * Ces devises ne sont pas divisées par 100
 * @see https://docs.stripe.com/currencies#zero-decimal
 */
export const ZERO_DECIMAL_CURRENCIES = [
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
] as const

/**
 * Taux de change Stripe (basé sur 5 USD = 2811 XAF)
 * 1 USD = 562.2 FCFA
 */
export const USD_TO_XAF_RATE = 562.2

// ============================================
// Stripe Amount Conversion
// ============================================

/**
 * Vérifie si une devise est à zéro décimale
 */
export function isZeroDecimalCurrency(currency: string): boolean {
  return ZERO_DECIMAL_CURRENCIES.includes(
    currency.toUpperCase() as ZeroDecimalCurrency
  )
}

/**
 * Convertit un montant Stripe en montant réel
 *
 * Stripe renvoie les montants en centimes pour les devises à 2 décimales
 * mais les devises à zéro décimale (comme XAF) sont déjà en unités entières
 *
 * @param amountTotal - Le montant total de Stripe (peut être null)
 * @param currency - Le code de devise (ex: "USD", "XAF")
 * @returns Le montant converti ou 0 si le montant est null/undefined
 *
 * @example
 * convertStripeAmount(500, "USD") // 5.00 USD
 * convertStripeAmount(1000, "XAF") // 1000 XAF
 * convertStripeAmount(null, "USD") // 0
 */
export function convertStripeAmount(
  amountTotal: number | null | undefined,
  currency: string | null | undefined
): number {
  if (amountTotal === null || amountTotal === undefined) {
    return 0
  }

  const normalizedCurrency = (currency ?? "USD").toUpperCase()
  const isZeroDecimal = isZeroDecimalCurrency(normalizedCurrency)

  return isZeroDecimal ? amountTotal : amountTotal / 100
}

// ============================================
// Currency Conversion
// ============================================

/**
 * Convertir USD → XAF ou XAF → USD
 */
export const convertCurrency = (
  amount: number,
  from: Currency,
  to: Currency
): number => {
  if (from === to) return amount

  if (from === "USD" && to === "XAF") {
    return amount * USD_TO_XAF_RATE
  }

  if (from === "XAF" && to === "USD") {
    return amount / USD_TO_XAF_RATE
  }

  return amount
}

// ============================================
// Currency Formatting
// ============================================

/**
 * Formater un montant avec sa devise
 * @example formatCurrency(5, "USD") → "$5.00"
 * @example formatCurrency(2811, "XAF") → "2 811 FCFA"
 */
export const formatCurrency = (amount: number, currency: Currency): string => {
  if (currency === "USD") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  // XAF : pas de décimales, FCFA après le montant
  const formatted = new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)

  return `${formatted} FCFA`
}

/**
 * Afficher montant original + équivalent converti
 * @example formatDualCurrency(2811, "XAF") → "2 811 FCFA (~$5.00)"
 * @example formatDualCurrency(5, "USD") → "$5.00 (~2 811 FCFA)"
 */
export const formatDualCurrency = (
  amount: number,
  originalCurrency: Currency,
  showConversion: boolean = true
): string => {
  if (!showConversion) {
    return formatCurrency(amount, originalCurrency)
  }

  const targetCurrency = originalCurrency === "USD" ? "XAF" : "USD"
  const converted = convertCurrency(amount, originalCurrency, targetCurrency)

  const original = formatCurrency(amount, originalCurrency)
  const target = formatCurrency(converted, targetCurrency)

  return `${original} (~${target})`
}
