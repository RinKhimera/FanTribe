import { Doc } from "../_generated/dataModel"
import { MutationCtx, QueryCtx } from "../_generated/server"
import { createAppError } from "./errors"

type DbCtx = QueryCtx | MutationCtx

/**
 * Options pour la récupération de l'utilisateur authentifié
 */
interface GetAuthenticatedUserOptions {
  /** Si true, ne lance pas d'erreur si non authentifié (retourne null) */
  optional?: boolean
  /** Si true, requiert un username défini (profil complet) */
  requireCompleteProfile?: boolean
  /** Types de compte autorisés */
  allowedAccountTypes?: Array<"USER" | "CREATOR" | "SUPERUSER">
}

/**
 * Récupère l'utilisateur authentifié avec vérifications
 *
 * @example
 * // Basique - lance une erreur si non authentifié
 * const user = await getAuthenticatedUser(ctx)
 *
 * // Optionnel - retourne null si non authentifié
 * const user = await getAuthenticatedUser(ctx, { optional: true })
 *
 * // Créateurs uniquement
 * const creator = await getAuthenticatedUser(ctx, {
 *   allowedAccountTypes: ["CREATOR", "SUPERUSER"]
 * })
 */
export const getAuthenticatedUser = async <TOptional extends boolean = false>(
  ctx: DbCtx,
  options?: GetAuthenticatedUserOptions & { optional?: TOptional },
): Promise<TOptional extends true ? Doc<"users"> | null : Doc<"users">> => {
  const identity = await ctx.auth.getUserIdentity()

  if (!identity) {
    if (options?.optional) {
      return null as TOptional extends true ? Doc<"users"> | null : Doc<"users">
    }
    throw createAppError("NOT_AUTHENTICATED")
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_tokenIdentifier", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique()

  if (!user) {
    if (options?.optional) {
      return null as TOptional extends true ? Doc<"users"> | null : Doc<"users">
    }
    throw createAppError("USER_NOT_FOUND", {
      context: { tokenIdentifier: identity.tokenIdentifier },
    })
  }

  // Vérification du bannissement
  if (user.isBanned) {
    // Self-healing : ne pas bloquer si le ban temporaire a expiré
    const isTempBanExpired =
      user.banDetails?.type === "temporary" &&
      user.banDetails?.expiresAt &&
      Date.now() > user.banDetails.expiresAt

    if (!isTempBanExpired) {
      if (options?.optional) {
        return null as TOptional extends true ? Doc<"users"> | null : Doc<"users">
      }
      throw createAppError("BANNED", {
        userMessage: !user.banDetails
          ? undefined // fallback vers le message par défaut de errors.ts
          : user.banDetails.type === "permanent"
            ? "Votre compte a été définitivement suspendu."
            : "Votre compte est temporairement suspendu.",
      })
    }
    // Ban temporaire expiré : laisser passer, le cron nettoiera la DB
  }

  // Vérification du profil complet
  if (options?.requireCompleteProfile && !user.username) {
    throw createAppError("INVALID_INPUT", {
      userMessage: "Veuillez compléter votre profil avant de continuer",
      context: { userId: user._id },
    })
  }

  // Vérification du type de compte
  if (
    options?.allowedAccountTypes &&
    !options.allowedAccountTypes.includes(user.accountType)
  ) {
    throw createAppError("FORBIDDEN", {
      userMessage: "Vous n'avez pas les permissions nécessaires",
      context: {
        userId: user._id.toString(),
        accountType: user.accountType,
        requiredTypes: options.allowedAccountTypes.join(","),
      },
    })
  }

  return user
}

/**
 * Vérifie si l'utilisateur courant est un superuser
 */
export const requireSuperuser = async (ctx: DbCtx): Promise<Doc<"users">> => {
  return getAuthenticatedUser(ctx, { allowedAccountTypes: ["SUPERUSER"] })
}

/**
 * Vérifie si l'utilisateur courant est un créateur ou superuser
 */
export const requireCreator = async (ctx: DbCtx): Promise<Doc<"users">> => {
  return getAuthenticatedUser(ctx, {
    allowedAccountTypes: ["CREATOR", "SUPERUSER"],
  })
}
