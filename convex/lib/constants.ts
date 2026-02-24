/**
 * Centralized business constants for FanTribe.
 * All commission rates, tip amounts, and payment config in one place.
 * Imported by both Convex backend functions and Next.js frontend.
 */

// ============================================
// Commission Rates
// ============================================

/** Creator's share of subscription revenue (70%) */
export const SUBSCRIPTION_CREATOR_RATE = 0.7

/** Platform's share of subscription revenue (30%) */
export const SUBSCRIPTION_PLATFORM_RATE = 0.3

/** Creator's share of tip revenue (70%) */
export const TIP_CREATOR_RATE = 0.7

/** Platform's share of tip revenue (30%) */
export const TIP_PLATFORM_RATE = 0.3

// ============================================
// Tip Configuration
// ============================================

/** Preset tip amounts in XAF */
export const TIP_PRESETS_XAF = [500, 1000, 2500, 5000, 10000] as const

/** Minimum custom tip amount in XAF */
export const TIP_MIN_AMOUNT_XAF = 500

/** Maximum custom tip amount in XAF (safety cap) */
export const TIP_MAX_AMOUNT_XAF = 100_000

/** Maximum length for optional tip message */
export const TIP_MESSAGE_MAX_LENGTH = 200

// ============================================
// Subscription Configuration
// ============================================

/** Monthly subscription price in XAF */
export const SUBSCRIPTION_PRICE_XAF = 1000

/** Subscription duration in milliseconds (30 days) */
export const SUBSCRIPTION_DURATION_MS = 30 * 24 * 60 * 60 * 1000

// ============================================
// Currency
// ============================================

/** USD to XAF conversion rate */
export const USD_TO_XAF_RATE = 562.2
