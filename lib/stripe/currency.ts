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

export type ZeroDecimalCurrency = (typeof ZERO_DECIMAL_CURRENCIES)[number]

/**
 * Vérifie si une devise est à zéro décimale
 */
export function isZeroDecimalCurrency(currency: string): boolean {
  return ZERO_DECIMAL_CURRENCIES.includes(
    currency.toUpperCase() as ZeroDecimalCurrency,
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
  currency: string | null | undefined,
): number {
  if (amountTotal === null || amountTotal === undefined) {
    return 0
  }

  const normalizedCurrency = (currency ?? "USD").toUpperCase()
  const isZeroDecimal = isZeroDecimalCurrency(normalizedCurrency)

  return isZeroDecimal ? amountTotal : amountTotal / 100
}
