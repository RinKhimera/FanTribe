import { Id } from "../_generated/dataModel"
import { MutationCtx, QueryCtx } from "../_generated/server"

type DbCtx = QueryCtx | MutationCtx

export type SubscriptionType = "content_access" | "messaging_access"
export type SubscriptionStatus = "active" | "expired" | "canceled" | "pending"

/**
 * Récupère les IDs des créateurs auxquels un utilisateur est abonné activement
 *
 * @example
 * const creatorIds = await getActiveSubscribedCreatorIds(ctx, userId, "content_access")
 */
export const getActiveSubscribedCreatorIds = async (
  ctx: DbCtx,
  subscriberId: Id<"users">,
  type: SubscriptionType = "content_access",
): Promise<Set<Id<"users">>> => {
  const subs = await ctx.db
    .query("subscriptions")
    .withIndex("by_subscriber_type", (q) =>
      q.eq("subscriber", subscriberId).eq("type", type),
    )
    .collect()

  return new Set(
    subs.filter((s) => s.status === "active").map((s) => s.creator),
  )
}

/**
 * Vérifie si un utilisateur a un abonnement actif à un créateur
 */
export const hasActiveSubscription = async (
  ctx: DbCtx,
  subscriberId: Id<"users">,
  creatorId: Id<"users">,
  type: SubscriptionType = "content_access",
): Promise<boolean> => {
  const sub = await ctx.db
    .query("subscriptions")
    .withIndex("by_creator_subscriber", (q) =>
      q.eq("creator", creatorId).eq("subscriber", subscriberId),
    )
    .filter((q) => q.eq(q.field("type"), type))
    .filter((q) => q.eq(q.field("status"), "active"))
    .first()

  return sub !== null
}

/**
 * Récupère les abonnés d'un créateur avec un statut spécifique
 *
 * @example
 * const activeSubscribers = await getCreatorSubscribers(ctx, creatorId, ["active"])
 * const allSubscribers = await getCreatorSubscribers(ctx, creatorId, ["active", "expired"])
 */
export const getCreatorSubscribers = async (
  ctx: DbCtx,
  creatorId: Id<"users">,
  statuses: SubscriptionStatus[] = ["active"],
  type: SubscriptionType = "content_access",
): Promise<Id<"users">[]> => {
  const subs = await ctx.db
    .query("subscriptions")
    .withIndex("by_creator_type", (q) =>
      q.eq("creator", creatorId).eq("type", type),
    )
    .collect()

  const statusSet = new Set(statuses)
  return [
    ...new Set(
      subs
        .filter((s) => statusSet.has(s.status))
        .map((s) => s.subscriber)
        .filter((id) => id !== creatorId), // Exclure le créateur lui-même
    ),
  ]
}

/**
 * Vérifie si un utilisateur peut voir du contenu "subscribers_only"
 * Prend en compte : propriétaire, abonné actif, superuser
 */
export const canViewSubscribersOnlyContent = async (
  ctx: DbCtx,
  viewerId: Id<"users">,
  creatorId: Id<"users">,
  viewerAccountType: "USER" | "CREATOR" | "SUPERUSER",
): Promise<boolean> => {
  // Le propriétaire peut toujours voir son contenu
  if (viewerId === creatorId) return true

  // Les superusers voient tout
  if (viewerAccountType === "SUPERUSER") return true

  // Vérifier l'abonnement actif
  return hasActiveSubscription(ctx, viewerId, creatorId, "content_access")
}
