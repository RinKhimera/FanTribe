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

  // CinetPay
  NEXT_PUBLIC_CINETPAY_SITE_ID: z
    .string()
    .min(1, "NEXT_PUBLIC_CINETPAY_SITE_ID is required"),
  NEXT_PUBLIC_CINETPAY_API_KEY: z
    .string()
    .min(1, "NEXT_PUBLIC_CINETPAY_API_KEY is required"),
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
})

/**
 * Type helper pour les variables d'environnement client
 */
export type ClientEnv = z.infer<typeof clientEnvSchema>
