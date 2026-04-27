import { type ClientEnv, clientEnvSchema } from "@/lib/config/env.schemas"

/**
 * ✅ VARIABLES CLIENT (NEXT_PUBLIC_*)
 * Ce fichier ne valide que les variables réellement importées via `clientEnv.XXX`.
 *
 * Les autres NEXT_PUBLIC_* (Clerk sign-in/sign-up URLs, CinetPay keys,
 * payment test mode) sont lues directement via process.env par leurs
 * modules respectifs — pas besoin de les valider ici.
 */

/**
 * Variables d'environnement client validées et typées
 * Accessible partout (client et serveur)
 */
export const clientEnv = clientEnvSchema.parse({
  NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL,
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
})

export type { ClientEnv }
