import { z } from "zod"

/**
 * ✅ VARIABLES CLIENT (NEXT_PUBLIC_*)
 * Ce fichier ne valide que les variables réellement importées via `clientEnv.XXX`.
 *
 * Les autres NEXT_PUBLIC_* (Clerk sign-in/sign-up URLs, CinetPay keys,
 * payment test mode) sont lues directement via process.env par leurs
 * modules respectifs — pas besoin de les valider ici.
 */
const clientEnvSchema = z.object({
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

/**
 * Variables d'environnement client validées et typées
 * Accessible partout (client et serveur)
 */
export const clientEnv = clientEnvSchema.parse({
  NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL,
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
})

/**
 * Type helper pour les variables d'environnement client
 */
export type ClientEnv = z.infer<typeof clientEnvSchema>
