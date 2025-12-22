/**
 * Service simple de gestion des devises pour FanTribe
 * Gère uniquement USD et XAF (Franc CFA) selon les taux Stripe
 *
 * Contexte :
 * - Prix unique : 5 USD pour l'abonnement
 * - Stripe convertit automatiquement : 5 USD ≈ 2811 XAF
 * - Taux : 1 USD ≈ 562.2 XAF (2811 ÷ 5)
 * - Public cible : utilisateurs africains (XAF)
 */

export type Currency = "USD" | "XAF"

/**
 * Taux de change Stripe (basé sur 5 USD = 2811 XAF)
 * 1 USD = 562.2 FCFA
 */
export const USD_TO_XAF_RATE = 562.2

/**
 * Convertir USD → XAF ou XAF → USD
 */
export const convertCurrency = (
  amount: number,
  from: Currency,
  to: Currency,
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
 * @example formatDualCurrency(2811, "XAF", "USD") → "2 811 FCFA (~$5.00)"
 * @example formatDualCurrency(5, "USD", "XAF") → "$5.00 (~2 811 FCFA)"
 */
export const formatDualCurrency = (
  amount: number,
  originalCurrency: Currency,
  showConversion: boolean = true,
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
