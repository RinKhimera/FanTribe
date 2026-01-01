import { z } from "zod"

/**
 * ⚠️ VARIABLES SERVEUR UNIQUEMENT
 * Ce fichier ne peut être importé que dans du code serveur:
 * - Server Actions ("use server")
 * - API Routes
 * - Server Components (sans "use client")
 * 
 * Pour du code client, utilisez lib/env.client.ts
 */
const serverEnvSchema = z.object({
  // Node environment
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  // Convex (Backend)
  CONVEX_DEPLOYMENT: z.string().min(1, "CONVEX_DEPLOYMENT is required"),

  // Clerk (Authentication) - Server only
  CLERK_SECRET_KEY: z
    .string()
    .startsWith("sk_", "CLERK_SECRET_KEY must start with 'sk_'"),
  CLERK_WEBHOOK_SECRET: z
    .string()
    .startsWith("whsec_", "CLERK_WEBHOOK_SECRET must start with 'whsec_'"),

  // Stripe (Card payments) - Server only
  STRIPE_SECRET_KEY: z
    .string()
    .startsWith("sk_", "STRIPE_SECRET_KEY must start with 'sk_'"),
  STRIPE_WEBHOOK_SECRET: z
    .string()
    .startsWith("whsec_", "STRIPE_WEBHOOK_SECRET must start with 'whsec_'"),
  STRIPE_PRICE_ID: z
    .string()
    .startsWith("price_", "STRIPE_PRICE_ID must start with 'price_'"),

  // Resend (Email) - Server only
  RESEND_API_KEY: z
    .string()
    .startsWith("re_", "RESEND_API_KEY must start with 're_'"),

  // CinetPay (Mobile Money payments) - Server only
  CINETPAY_SECRET_KEY: z
    .string()
    .min(1, "CINETPAY_SECRET_KEY is required for HMAC verification"),
})

/**
 * Variables d'environnement serveur validées et typées
 * @throws {ZodError} Si la validation échoue
 */
export const env = serverEnvSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  CONVEX_DEPLOYMENT: process.env.CONVEX_DEPLOYMENT,
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
  CLERK_WEBHOOK_SECRET: process.env.CLERK_WEBHOOK_SECRET,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  STRIPE_PRICE_ID: process.env.STRIPE_PRICE_ID,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  CINETPAY_SECRET_KEY: process.env.CINETPAY_SECRET_KEY,
})

/**
 * Type helper pour les variables d'environnement serveur
 */
export type ServerEnv = z.infer<typeof serverEnvSchema>
