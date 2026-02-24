/**
 * Re-export des constantes business depuis le backend Convex.
 * Permet au frontend Next.js d'accéder aux mêmes constantes.
 */
export {
  SUBSCRIPTION_CREATOR_RATE,
  SUBSCRIPTION_PLATFORM_RATE,
  TIP_CREATOR_RATE,
  TIP_PLATFORM_RATE,
  TIP_PRESETS_XAF,
  TIP_MIN_AMOUNT_XAF,
  TIP_MAX_AMOUNT_XAF,
  TIP_MESSAGE_MAX_LENGTH,
  SUBSCRIPTION_PRICE_XAF,
  SUBSCRIPTION_DURATION_MS,
  USD_TO_XAF_RATE,
} from "@/convex/lib/constants"
