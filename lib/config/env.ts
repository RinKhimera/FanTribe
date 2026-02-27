import { z } from "zod"

/**
 * ⚠️ VARIABLES SERVEUR UNIQUEMENT
 * Ce fichier ne peut être importé que dans du code serveur:
 * - Server Actions ("use server")
 * - API Routes
 * - Server Components (sans "use client")
 *
 * Pour du code client, utilisez lib/env.client.ts
 *
 * Note: CLERK_SECRET_KEY, CLERK_WEBHOOK_SECRET, CONVEX_DEPLOYMENT sont
 * lus directement par leurs SDKs respectifs via process.env — pas besoin
 * de les valider ici. Les secrets Bunny/CinetPay/Stripe webhook sont
 * exclusivement dans le dashboard Convex.
 */
const serverEnvSchema = z.object({
  // Node environment
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  // Stripe (Card payments) - Server only
  STRIPE_SECRET_KEY: z
    .string()
    .startsWith("sk_", "STRIPE_SECRET_KEY must start with 'sk_'"),
  STRIPE_PRICE_ID: z
    .string()
    .startsWith("price_", "STRIPE_PRICE_ID must start with 'price_'"),

  // Resend (Email) - Server only
  RESEND_API_KEY: z
    .string()
    .startsWith("re_", "RESEND_API_KEY must start with 're_'"),
})

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

/**
 * Type helper pour les variables d'environnement serveur
 */
export type ServerEnv = z.infer<typeof serverEnvSchema>
