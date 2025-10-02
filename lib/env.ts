import { z } from "zod"

/**
 * Schéma de validation pour les variables d'environnement
 * Toutes les variables NEXT_PUBLIC_* sont accessibles côté client
 * Les autres sont uniquement côté serveur
 */
const envSchema = z.object({
  // Node environment
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  // Convex (Backend)
  CONVEX_DEPLOYMENT: z.string().min(1, "CONVEX_DEPLOYMENT is required"),
  NEXT_PUBLIC_CONVEX_URL: z
    .string()
    .url("NEXT_PUBLIC_CONVEX_URL must be a valid URL"),

  // Clerk (Authentication)
  CLERK_SECRET_KEY: z
    .string()
    .startsWith("sk_", "CLERK_SECRET_KEY must start with 'sk_'"),
  CLERK_WEBHOOK_SECRET: z
    .string()
    .startsWith("whsec_", "CLERK_WEBHOOK_SECRET must start with 'whsec_'"),
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

  // Bunny CDN
  NEXT_PUBLIC_BUNNY_VIDEO_LIBRARY_ID: z
    .string()
    .min(1, "NEXT_PUBLIC_BUNNY_VIDEO_LIBRARY_ID is required"),
  NEXT_PUBLIC_BUNNY_VIDEO_ACCESS_KEY: z
    .string()
    .min(1, "NEXT_PUBLIC_BUNNY_VIDEO_ACCESS_KEY is required"),
  NEXT_PUBLIC_BUNNY_STORAGE_ZONE_NAME: z
    .string()
    .min(1, "NEXT_PUBLIC_BUNNY_STORAGE_ZONE_NAME is required"),
  NEXT_PUBLIC_BUNNY_STORAGE_ACCESS_KEY: z
    .string()
    .min(1, "NEXT_PUBLIC_BUNNY_STORAGE_ACCESS_KEY is required"),
  NEXT_PUBLIC_BUNNY_PULL_ZONE_URL: z
    .string()
    .url("NEXT_PUBLIC_BUNNY_PULL_ZONE_URL must be a valid URL"),

  // CinetPay (African payment processor)
  NEXT_PUBLIC_CINETPAY_SITE_ID: z
    .string()
    .min(1, "NEXT_PUBLIC_CINETPAY_SITE_ID is required"),
  NEXT_PUBLIC_CINETPAY_API_KEY: z
    .string()
    .min(1, "NEXT_PUBLIC_CINETPAY_API_KEY is required"),

  // Stripe (Card payments)
  STRIPE_SECRET_KEY: z
    .string()
    .startsWith("sk_", "STRIPE_SECRET_KEY must start with 'sk_'"),
  STRIPE_WEBHOOK_SECRET: z
    .string()
    .startsWith("whsec_", "STRIPE_WEBHOOK_SECRET must start with 'whsec_'"),
  STRIPE_PRICE_ID: z
    .string()
    .startsWith("price_", "STRIPE_PRICE_ID must start with 'price_'"),

  // Resend (Email)
  RESEND_API_KEY: z
    .string()
    .startsWith("re_", "RESEND_API_KEY must start with 're_'"),
})

/**
 * Variables d'environnement validées et typées
 * @throws {ZodError} Si la validation échoue
 */
export const env = envSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  CONVEX_DEPLOYMENT: process.env.CONVEX_DEPLOYMENT,
  NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL,
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
  CLERK_WEBHOOK_SECRET: process.env.CLERK_WEBHOOK_SECRET,
  NEXT_PUBLIC_CLERK_FRONTEND_API_URL:
    process.env.NEXT_PUBLIC_CLERK_FRONTEND_API_URL,
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL,
  NEXT_PUBLIC_BUNNY_VIDEO_LIBRARY_ID:
    process.env.NEXT_PUBLIC_BUNNY_VIDEO_LIBRARY_ID,
  NEXT_PUBLIC_BUNNY_VIDEO_ACCESS_KEY:
    process.env.NEXT_PUBLIC_BUNNY_VIDEO_ACCESS_KEY,
  NEXT_PUBLIC_BUNNY_STORAGE_ZONE_NAME:
    process.env.NEXT_PUBLIC_BUNNY_STORAGE_ZONE_NAME,
  NEXT_PUBLIC_BUNNY_STORAGE_ACCESS_KEY:
    process.env.NEXT_PUBLIC_BUNNY_STORAGE_ACCESS_KEY,
  NEXT_PUBLIC_BUNNY_PULL_ZONE_URL: process.env.NEXT_PUBLIC_BUNNY_PULL_ZONE_URL,
  NEXT_PUBLIC_CINETPAY_SITE_ID: process.env.NEXT_PUBLIC_CINETPAY_SITE_ID,
  NEXT_PUBLIC_CINETPAY_API_KEY: process.env.NEXT_PUBLIC_CINETPAY_API_KEY,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  STRIPE_PRICE_ID: process.env.STRIPE_PRICE_ID,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
})

/**
 * Type helper pour les variables d'environnement
 */
export type Env = z.infer<typeof envSchema>
