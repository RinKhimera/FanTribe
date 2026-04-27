import { type ServerEnv, serverEnvSchema } from "@/lib/config/env.schemas"

/**
 * ⚠️ VARIABLES SERVEUR UNIQUEMENT
 * Ce fichier ne peut être importé que dans du code serveur:
 * - Server Actions ("use server")
 * - API Routes
 * - Server Components (sans "use client")
 *
 * Pour du code client, utilisez lib/config/env.client.ts
 *
 * Note: CLERK_SECRET_KEY, CLERK_WEBHOOK_SECRET, CONVEX_DEPLOYMENT sont
 * lus directement par leurs SDKs respectifs via process.env — pas besoin
 * de les valider ici. Les secrets Bunny/CinetPay/Stripe webhook sont
 * exclusivement dans le dashboard Convex.
 */

/**
 * Variables d'environnement serveur validées et typées
 * @throws {ZodError} Si la validation échoue
 */
export const env = serverEnvSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_PRICE_ID: process.env.STRIPE_PRICE_ID,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
})

export type { ServerEnv }
