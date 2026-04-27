import { z } from "zod"

/**
 * Schémas Zod pour les variables d'environnement.
 * Fichier sans side-effect (pas de .parse()) afin d'être importable depuis
 * des scripts qui n'ont pas accès au runtime (validation CI, sync-env, …).
 */

export const serverEnvSchema = z.object({
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

export const clientEnvSchema = z.object({
  // Convex
  NEXT_PUBLIC_CONVEX_URL: z
    .string()
    .url("NEXT_PUBLIC_CONVEX_URL must be a valid URL"),

  // Clerk (Authentication)
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z
    .string()
    .startsWith(
      "pk_",
      "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY must start with 'pk_'",
    ),
})

export type ServerEnv = z.infer<typeof serverEnvSchema>
export type ClientEnv = z.infer<typeof clientEnvSchema>
