import { z } from "zod"

/**
 * ✅ VARIABLES CLIENT (NEXT_PUBLIC_*)
 * Ce fichier peut être importé partout (client et serveur)
 * Seules les variables commençant par NEXT_PUBLIC_ sont ici
 */
const clientEnvSchema = z.object({
  // Convex
  NEXT_PUBLIC_CONVEX_URL: z
    .string()
    .url("NEXT_PUBLIC_CONVEX_URL must be a valid URL"),

  // Clerk (Authentication)
  NEXT_PUBLIC_CLERK_FRONTEND_API_URL: z
    .string()
    .url("NEXT_PUBLIC_CLERK_FRONTEND_API_URL must be a valid URL"),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z
    .string()
    .startsWith(
      "pk_",
      "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY must start with 'pk_'",
    ),
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: z.string().default("/auth/sign-in"),
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: z.string().default("/auth/sign-up"),

  // Bunny CDN — Keys are managed in Convex dashboard only
  // No NEXT_PUBLIC_BUNNY_* secrets needed here

  // CinetPay
  NEXT_PUBLIC_CINETPAY_SITE_ID: z
    .string()
    .min(1, "NEXT_PUBLIC_CINETPAY_SITE_ID is required"),
  NEXT_PUBLIC_CINETPAY_API_KEY: z
    .string()
    .min(1, "NEXT_PUBLIC_CINETPAY_API_KEY is required"),

  // Payment test mode
  NEXT_PUBLIC_PAYMENT_TEST_MODE: z.string().default("false"),
  NEXT_PUBLIC_PAYMENT_TEST_FORCE_FAIL: z.string().default("false"),
})

/**
 * Variables d'environnement client validées et typées
 * Accessible partout (client et serveur)
 */
export const clientEnv = clientEnvSchema.parse({
  NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL,
  NEXT_PUBLIC_CLERK_FRONTEND_API_URL:
    process.env.NEXT_PUBLIC_CLERK_FRONTEND_API_URL,
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL,
  NEXT_PUBLIC_CINETPAY_SITE_ID: process.env.NEXT_PUBLIC_CINETPAY_SITE_ID,
  NEXT_PUBLIC_CINETPAY_API_KEY: process.env.NEXT_PUBLIC_CINETPAY_API_KEY,
  NEXT_PUBLIC_PAYMENT_TEST_MODE: process.env.NEXT_PUBLIC_PAYMENT_TEST_MODE,
  NEXT_PUBLIC_PAYMENT_TEST_FORCE_FAIL:
    process.env.NEXT_PUBLIC_PAYMENT_TEST_FORCE_FAIL,
})

/**
 * Type helper pour les variables d'environnement client
 */
export type ClientEnv = z.infer<typeof clientEnvSchema>
